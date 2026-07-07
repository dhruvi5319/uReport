package com.ureport.crm;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ureport.domain.*;
import com.ureport.repository.*;
import com.ureport.security.JwtUtil;
import com.ureport.security.PersonDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for media upload, serve, and delete.
 *
 * Uses native sidecar PostgreSQL (no Testcontainers — no Docker daemon in K8s sandbox).
 * DATABASE_URL is injected by the platform; application-test.properties points Flyway
 * at the real database.
 *
 * A @TempDir is used as the media root so tests are isolated and cleanup is automatic.
 *
 * Test cases:
 * 1. POST /api/tickets/{id}/media with valid JPEG → 200 MediaDto; file+thumb on disk; history row
 * 2. POST /api/tickets/{id}/media with PNG → 200 (PNG accepted)
 * 3. POST /api/tickets/{id}/media with PDF (magic bytes %PDF) → 400 INVALID_MIME_TYPE
 * 4. POST /api/tickets/{id}/media with 11 MB file → 400 FILE_TOO_LARGE
 * 5. GET /api/media/{mediaId} → 200 with Content-Type: image/jpeg and file bytes
 * 6. GET /api/media/{mediaId}/thumbnail → 200 with thumbnail bytes; verify 150x150 via ImageIO
 * 7. DELETE /api/tickets/{id}/media/{mediaId} with staff JWT → 204; file deleted; DB record gone
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MediaUploadIT {

    @TempDir
    static Path tempMediaRoot;

    @DynamicPropertySource
    static void configureMediaRoot(DynamicPropertyRegistry registry) {
        registry.add("media.root", () -> tempMediaRoot.toString());
    }

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JwtUtil jwtUtil;

    @Autowired TicketRepository ticketRepository;
    @Autowired TicketHistoryRepository ticketHistoryRepository;
    @Autowired PersonRepository personRepository;
    @Autowired CategoryRepository categoryRepository;
    @Autowired DepartmentRepository departmentRepository;
    @Autowired ActionsRepository actionsRepository;
    @Autowired MediaRepository mediaRepository;
    @Autowired SubstatusRepository substatusRepository;

    private String staffJwt;
    private Long ticketId;
    private Long uploadMediaActionId;

    @BeforeEach
    void setUp() {
        // Seed department
        Department dept = new Department();
        dept.setName("MediaTestDept_" + System.nanoTime());
        dept = departmentRepository.save(dept);

        // Seed category
        Category cat = new Category();
        cat.setName("MediaTestCat_" + System.nanoTime());
        cat.setActive(true);
        cat.setDepartment(dept);
        cat.setDisplayPermissionLevel("staff");
        cat.setPostingPermissionLevel("staff");
        cat.setLastModified(LocalDateTime.now());
        cat = categoryRepository.save(cat);

        // Seed staff person
        Person staff = new Person();
        staff.setFirstname("MediaStaff");
        staff.setLastname("User");
        staff.setUsername("mediastaff_" + System.nanoTime());
        staff.setEmail("mediastaff_" + System.nanoTime() + "@example.com");
        staff.setRole("staff");
        staff = personRepository.save(staff);
        staffJwt = jwtUtil.generateToken(new PersonDetails(staff));

        // Seed ticket
        Ticket ticket = new Ticket();
        ticket.setStatus("open");
        ticket.setCategory(cat);
        ticket.setDescription("Media test ticket");
        ticket.setLocation("123 Media St");
        ticket.setEnteredDate(LocalDateTime.now());
        ticket.setLastModified(LocalDateTime.now());
        ticket = ticketRepository.save(ticket);
        ticketId = ticket.getId();

        // Get upload_media action ID
        uploadMediaActionId = actionsRepository.findByName("upload_media")
                .map(Action::getId)
                .orElseThrow(() -> new IllegalStateException(
                        "'upload_media' action missing from actions table — check V1 migration"));
    }

    // -----------------------------------------------------------------------
    // Test 1: Upload valid JPEG → 200, file + thumb on disk, history row
    // -----------------------------------------------------------------------
    @Test
    void uploadJpeg_validStaffJwt_returns200WithMediaDto() throws Exception {
        byte[] jpegBytes = buildMinimalJpeg();
        MockMultipartFile file = new MockMultipartFile(
                "files", "test.jpg", "image/jpeg", jpegBytes);

        String response = mockMvc.perform(multipart("/api/tickets/{id}/media", ticketId)
                        .file(file)
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").isNumber())
                .andExpect(jsonPath("$[0].ticketId").value(ticketId))
                .andExpect(jsonPath("$[0].mimeType").value("image/jpeg"))
                .andExpect(jsonPath("$[0].url").value(matchesRegex("/api/media/\\d+")))
                .andExpect(jsonPath("$[0].thumbnailUrl").value(matchesRegex("/api/media/\\d+/thumbnail")))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long mediaId = objectMapper.readTree(response).get(0).get("id").asLong();
        String internalFilename = objectMapper.readTree(response).get(0)
                .get("internalFilename").asText();

        // Verify file exists on disk
        Path fileOnDisk = tempMediaRoot.resolve(String.valueOf(ticketId)).resolve(internalFilename);
        assertTrue(Files.exists(fileOnDisk), "Uploaded file should exist on disk");

        // Verify thumbnail exists on disk
        Path thumbOnDisk = tempMediaRoot.resolve(String.valueOf(ticketId))
                .resolve("thumb_" + internalFilename);
        assertTrue(Files.exists(thumbOnDisk), "Thumbnail should exist on disk");

        // Verify ticket_history has "upload_media" row
        List<TicketHistory> history = ticketHistoryRepository
                .findByTicketIdOrderByEnteredDateDesc(ticketId);
        assertTrue(history.stream().anyMatch(h -> uploadMediaActionId.equals(h.getActionId())),
                "ticket_history should have an 'upload_media' row after upload");
    }

    // -----------------------------------------------------------------------
    // Test 2: Upload PNG → 200 (PNG accepted)
    // -----------------------------------------------------------------------
    @Test
    void uploadPng_validStaffJwt_returns200() throws Exception {
        byte[] pngBytes = buildMinimalPng();
        MockMultipartFile file = new MockMultipartFile(
                "files", "test.png", "image/png", pngBytes);

        mockMvc.perform(multipart("/api/tickets/{id}/media", ticketId)
                        .file(file)
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].mimeType").value("image/png"));
    }

    // -----------------------------------------------------------------------
    // Test 3: Upload PDF (magic bytes %PDF) → 400 INVALID_MIME_TYPE
    // -----------------------------------------------------------------------
    @Test
    void uploadPdf_returns400InvalidMimeType() throws Exception {
        // PDF magic bytes: %PDF
        byte[] pdfBytes = new byte[512];
        pdfBytes[0] = 0x25; // %
        pdfBytes[1] = 0x50; // P
        pdfBytes[2] = 0x44; // D
        pdfBytes[3] = 0x46; // F

        MockMultipartFile file = new MockMultipartFile(
                "files", "test.pdf", "application/pdf", pdfBytes);

        mockMvc.perform(multipart("/api/tickets/{id}/media", ticketId)
                        .file(file)
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_MIME_TYPE"));
    }

    // -----------------------------------------------------------------------
    // Test 4: Upload 11 MB file → 400 FILE_TOO_LARGE
    // -----------------------------------------------------------------------
    @Test
    void uploadOversizeFile_returns400FileTooLarge() throws Exception {
        // Build a JPEG-magic-byte header followed by 11MB of zeros
        byte[] largeFile = new byte[11 * 1024 * 1024 + 100];
        // JPEG magic bytes at start so MIME check passes
        largeFile[0] = (byte) 0xFF;
        largeFile[1] = (byte) 0xD8;
        largeFile[2] = (byte) 0xFF;
        largeFile[3] = (byte) 0xE0;

        MockMultipartFile file = new MockMultipartFile(
                "files", "large.jpg", "image/jpeg", largeFile);

        mockMvc.perform(multipart("/api/tickets/{id}/media", ticketId)
                        .file(file)
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("FILE_TOO_LARGE"));
    }

    // -----------------------------------------------------------------------
    // Test 5: GET /api/media/{mediaId} → 200 with Content-Type: image/jpeg
    // -----------------------------------------------------------------------
    @Test
    void serveMedia_returns200WithCorrectContentType() throws Exception {
        Long mediaId = uploadTestJpeg();

        mockMvc.perform(get("/api/media/{mediaId}", mediaId))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", containsString("image/jpeg")));
    }

    // -----------------------------------------------------------------------
    // Test 6: GET /api/media/{mediaId}/thumbnail → 200, 150x150 dimensions
    // -----------------------------------------------------------------------
    @Test
    void serveThumbnail_returns200With150x150Dimensions() throws Exception {
        Long mediaId = uploadTestJpeg();

        byte[] thumbnailBytes = mockMvc.perform(get("/api/media/{mediaId}/thumbnail", mediaId))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", containsString("image/jpeg")))
                .andReturn()
                .getResponse()
                .getContentAsByteArray();

        // Verify dimensions using ImageIO
        BufferedImage img = ImageIO.read(new ByteArrayInputStream(thumbnailBytes));
        assertNotNull(img, "Thumbnail should be a readable image");
        assertEquals(150, img.getWidth(), "Thumbnail width should be 150");
        assertEquals(150, img.getHeight(), "Thumbnail height should be 150");
    }

    // -----------------------------------------------------------------------
    // Test 7: DELETE → 204; file deleted from disk; DB record gone
    // -----------------------------------------------------------------------
    @Test
    void deleteMedia_withStaffJwt_returns204AndRemovesFileAndDbRecord() throws Exception {
        byte[] jpegBytes = buildMinimalJpeg();
        MockMultipartFile file = new MockMultipartFile(
                "files", "to-delete.jpg", "image/jpeg", jpegBytes);

        String uploadResponse = mockMvc.perform(multipart("/api/tickets/{id}/media", ticketId)
                        .file(file)
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long mediaId = objectMapper.readTree(uploadResponse).get(0).get("id").asLong();
        String internalFilename = objectMapper.readTree(uploadResponse).get(0)
                .get("internalFilename").asText();

        // Verify file exists before delete
        Path fileOnDisk = tempMediaRoot.resolve(String.valueOf(ticketId)).resolve(internalFilename);
        assertTrue(Files.exists(fileOnDisk), "File should exist before delete");

        // Delete
        mockMvc.perform(delete("/api/tickets/{id}/media/{mediaId}", ticketId, mediaId)
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isNoContent());

        // Verify file removed from disk
        assertFalse(Files.exists(fileOnDisk), "File should be deleted from disk after delete");

        // Verify DB record removed
        assertFalse(mediaRepository.existsById(mediaId), "Media DB record should be deleted");
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    /**
     * Uploads a minimal JPEG and returns the mediaId.
     */
    private Long uploadTestJpeg() throws Exception {
        byte[] jpegBytes = buildMinimalJpeg();
        MockMultipartFile file = new MockMultipartFile(
                "files", "test_serve.jpg", "image/jpeg", jpegBytes);

        String response = mockMvc.perform(multipart("/api/tickets/{id}/media", ticketId)
                        .file(file)
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get(0).get("id").asLong();
    }

    /**
     * Builds a minimal valid JPEG byte array (200x200 white JPEG).
     */
    private byte[] buildMinimalJpeg() throws IOException {
        BufferedImage img = new BufferedImage(200, 200, BufferedImage.TYPE_INT_RGB);
        // Fill with white
        for (int x = 0; x < 200; x++) {
            for (int y = 0; y < 200; y++) {
                img.setRGB(x, y, 0xFFFFFF);
            }
        }
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "jpeg", baos);
        return baos.toByteArray();
    }

    /**
     * Builds a minimal valid PNG byte array (10x10 white PNG).
     */
    private byte[] buildMinimalPng() throws IOException {
        BufferedImage img = new BufferedImage(10, 10, BufferedImage.TYPE_INT_ARGB);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "png", baos);
        return baos.toByteArray();
    }
}
