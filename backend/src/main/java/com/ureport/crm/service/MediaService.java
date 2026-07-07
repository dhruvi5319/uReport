package com.ureport.crm.service;

import com.ureport.crm.dto.MediaDto;
import com.ureport.crm.exception.BusinessException;
import com.ureport.domain.Action;
import com.ureport.domain.Media;
import com.ureport.domain.Ticket;
import com.ureport.domain.TicketHistory;
import com.ureport.repository.ActionsRepository;
import com.ureport.repository.MediaRepository;
import com.ureport.repository.TicketHistoryRepository;
import com.ureport.repository.TicketRepository;
import com.ureport.security.PersonDetails;
import net.coobird.thumbnailator.Thumbnails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Media upload/serve/delete service.
 *
 * Security mitigations:
 * - T-04-18: MIME detection uses magic bytes exclusively (Content-Type header ignored)
 * - T-04-19: ticketId is a Long (DB-sourced); path built via Paths.get(mediaRoot, valueOf(ticketId))
 * - T-04-21: per-file size guard (10 MB) and per-request count guard (10 files)
 * - T-04-23: internalFilename is UUID-only; extension stripped of path separators
 */
@Service
@Transactional
public class MediaService {

    private static final Logger log = LoggerFactory.getLogger(MediaService.class);

    private static final long MAX_FILE_SIZE_BYTES = 10_485_760L; // 10 MB
    private static final int MAX_FILES_PER_REQUEST = 10;

    // Magic byte constants for MIME detection
    private static final byte[] JPEG_MAGIC = new byte[]{(byte)0xFF, (byte)0xD8, (byte)0xFF};
    private static final byte[] PNG_MAGIC  = new byte[]{(byte)0x89, 0x50, 0x4E, 0x47};
    private static final byte[] GIF_MAGIC  = new byte[]{0x47, 0x49, 0x46};

    @Value("${media.root:/var/ureport/media}")
    private String mediaRoot;

    private final MediaRepository mediaRepository;
    private final TicketRepository ticketRepository;
    private final TicketHistoryRepository ticketHistoryRepository;
    private final ActionsRepository actionsRepository;

    public MediaService(MediaRepository mediaRepository,
                        TicketRepository ticketRepository,
                        TicketHistoryRepository ticketHistoryRepository,
                        ActionsRepository actionsRepository) {
        this.mediaRepository = mediaRepository;
        this.ticketRepository = ticketRepository;
        this.ticketHistoryRepository = ticketHistoryRepository;
        this.actionsRepository = actionsRepository;
    }

    // -----------------------------------------------------------------------
    // UPLOAD
    // -----------------------------------------------------------------------

    /**
     * Upload one or more files for a ticket.
     *
     * @param ticketId    DB-sourced ticket ID (safe for path construction)
     * @param files       multipart files from the request
     * @param currentUser authenticated uploader
     * @return list of MediaDto for each saved file
     */
    public List<MediaDto> upload(Long ticketId, List<MultipartFile> files, PersonDetails currentUser) {
        // 1. Validate ticket exists
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new BusinessException("TICKET_NOT_FOUND",
                        "Ticket not found: " + ticketId, HttpStatus.NOT_FOUND));

        // 2. Validate count
        if (files == null || files.isEmpty()) {
            throw new BusinessException("NO_FILES", "No files provided");
        }
        if (files.size() > MAX_FILES_PER_REQUEST) {
            throw new BusinessException("TOO_MANY_FILES",
                    "Maximum " + MAX_FILES_PER_REQUEST + " files per request");
        }

        List<MediaDto> results = new ArrayList<>();

        for (MultipartFile file : files) {
            // 3a. Read first 8 bytes for magic byte MIME detection
            byte[] header = new byte[8];
            try (InputStream is = file.getInputStream()) {
                int read = is.read(header);
                if (read < 3) {
                    throw new BusinessException("INVALID_MIME_TYPE",
                            "File too small to determine MIME type: " + file.getOriginalFilename());
                }
            } catch (IOException e) {
                throw new BusinessException("FILE_READ_ERROR",
                        "Cannot read file: " + file.getOriginalFilename());
            }

            // 3b. Detect MIME from magic bytes (Content-Type header is ignored — T-04-18)
            String mimeType = detectMimeType(header);
            if (mimeType == null) {
                throw new BusinessException("INVALID_MIME_TYPE",
                        "Unsupported file type: " + file.getOriginalFilename());
            }

            // 3c. Size check (before writing to disk — T-04-21)
            if (file.getSize() > MAX_FILE_SIZE_BYTES) {
                throw new BusinessException("FILE_TOO_LARGE", "Maximum file size is 10 MB");
            }

            // 3d. Build safe internal filename: UUID + sanitized extension (T-04-23)
            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "";
            String ext = extractSafeExtension(originalName);
            String internalFilename = UUID.randomUUID().toString()
                    + (ext.isEmpty() ? "" : "." + ext);

            // 3e–3f. Create directory and write file
            // ticketId is a Long from DB — safe for path construction (T-04-19)
            Path dir = Paths.get(mediaRoot, String.valueOf(ticketId));
            try {
                Files.createDirectories(dir);
            } catch (IOException e) {
                throw new BusinessException("STORAGE_ERROR",
                        "Cannot create media directory: " + e.getMessage());
            }

            Path filePath = dir.resolve(internalFilename);
            try {
                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException e) {
                throw new BusinessException("STORAGE_ERROR",
                        "Cannot write file: " + e.getMessage());
            }

            // 3g. Generate thumbnail (failure is non-fatal — logs warning only)
            Path thumbPath = dir.resolve("thumb_" + internalFilename);
            try {
                Thumbnails.of(filePath.toFile())
                        .size(150, 150)
                        .toFile(thumbPath.toFile());
            } catch (IOException e) {
                log.warn("Thumbnail generation failed for {}: {}", internalFilename, e.getMessage());
            }

            // 3h. Build and save Media entity
            Media media = new Media();
            media.setTicket(ticket);
            media.setFilename(originalName);
            media.setInternalFilename(internalFilename);
            media.setMimeType(mimeType);
            media.setSizeBytes(file.getSize());
            media.setUploaded(LocalDateTime.now());
            media = mediaRepository.save(media);

            results.add(toDto(media));
        }

        // 4. Create ONE "upload_media" history entry for the batch
        createHistoryEntry(ticket, "upload_media", currentUser.getId());

        return results;
    }

    // -----------------------------------------------------------------------
    // SERVE
    // -----------------------------------------------------------------------

    /**
     * Stream a media file (full resolution or thumbnail).
     */
    @Transactional(readOnly = true)
    public ResponseEntity<Resource> serveMedia(Long mediaId, boolean thumbnail) {
        Media media = mediaRepository.findById(mediaId)
                .orElseThrow(() -> new BusinessException("MEDIA_NOT_FOUND",
                        "Media not found: " + mediaId, HttpStatus.NOT_FOUND));

        Long ticketId = media.getTicket() != null ? media.getTicket().getId() : null;
        if (ticketId == null) {
            throw new BusinessException("MEDIA_FILE_NOT_FOUND",
                    "Media has no associated ticket", HttpStatus.NOT_FOUND);
        }

        String filename = thumbnail
                ? "thumb_" + media.getInternalFilename()
                : media.getInternalFilename();

        Path filePath = Paths.get(mediaRoot, String.valueOf(ticketId), filename);
        if (!Files.exists(filePath)) {
            throw new BusinessException("MEDIA_FILE_NOT_FOUND",
                    "Media file not found on disk: " + mediaId, HttpStatus.NOT_FOUND);
        }

        String contentType = thumbnail ? "image/jpeg" : media.getMimeType();

        try {
            long fileSize = Files.size(filePath);
            InputStream is = Files.newInputStream(filePath);
            InputStreamResource resource = new InputStreamResource(is);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(fileSize))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (IOException e) {
            throw new BusinessException("STORAGE_ERROR",
                    "Cannot read media file: " + e.getMessage());
        }
    }

    // -----------------------------------------------------------------------
    // LIST
    // -----------------------------------------------------------------------

    /**
     * List all media attachments for a ticket.
     */
    @Transactional(readOnly = true)
    public List<MediaDto> listForTicket(Long ticketId) {
        ticketRepository.findById(ticketId)
                .orElseThrow(() -> new BusinessException("TICKET_NOT_FOUND",
                        "Ticket not found: " + ticketId, HttpStatus.NOT_FOUND));
        return mediaRepository.findByTicketIdOrderByUploadedAsc(ticketId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    // -----------------------------------------------------------------------
    // DELETE
    // -----------------------------------------------------------------------

    /**
     * Delete a media attachment (disk files + DB record).
     */
    public void deleteMedia(Long mediaId, PersonDetails currentUser) {
        Media media = mediaRepository.findById(mediaId)
                .orElseThrow(() -> new BusinessException("MEDIA_NOT_FOUND",
                        "Media not found: " + mediaId, HttpStatus.NOT_FOUND));

        Long ticketId = media.getTicket() != null ? media.getTicket().getId() : null;
        if (ticketId != null) {
            Path dir = Paths.get(mediaRoot, String.valueOf(ticketId));
            try {
                Files.deleteIfExists(dir.resolve(media.getInternalFilename()));
                Files.deleteIfExists(dir.resolve("thumb_" + media.getInternalFilename()));
            } catch (IOException e) {
                log.warn("Failed to delete media files for mediaId {}: {}", mediaId, e.getMessage());
            }
        }

        mediaRepository.delete(media);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Detect MIME type from magic bytes. Returns null if unsupported.
     * Content-Type header is intentionally NOT used (T-04-18).
     */
    private String detectMimeType(byte[] header) {
        if (startsWith(header, JPEG_MAGIC)) return "image/jpeg";
        if (startsWith(header, PNG_MAGIC))  return "image/png";
        if (startsWith(header, GIF_MAGIC))  return "image/gif";
        return null;
    }

    private boolean startsWith(byte[] data, byte[] prefix) {
        if (data.length < prefix.length) return false;
        for (int i = 0; i < prefix.length; i++) {
            if (data[i] != prefix[i]) return false;
        }
        return true;
    }

    /**
     * Extracts the file extension from the original filename,
     * stripping any path separators (T-04-23 — path traversal mitigation).
     */
    private String extractSafeExtension(String originalName) {
        if (originalName == null || originalName.isEmpty()) return "";
        int lastDot = originalName.lastIndexOf('.');
        if (lastDot < 0 || lastDot == originalName.length() - 1) return "";
        String ext = originalName.substring(lastDot + 1);
        // Strip all path-separator characters and whitespace
        ext = ext.replaceAll("[/\\\\\\s]", "");
        // Limit extension length to 10 chars
        if (ext.length() > 10) ext = ext.substring(0, 10);
        return ext.toLowerCase();
    }

    private void createHistoryEntry(Ticket ticket, String actionName, Long enteredByPersonId) {
        Action action = actionsRepository.findByName(actionName)
                .orElseThrow(() -> new IllegalStateException(
                        "Seed action '" + actionName + "' missing from actions table"));
        TicketHistory history = new TicketHistory();
        history.setTicket(ticket);
        history.setActionId(action.getId());
        history.setEnteredByPersonId(enteredByPersonId);
        history.setEnteredDate(LocalDateTime.now());
        history.setActionDate(LocalDateTime.now());
        ticketHistoryRepository.save(history);
    }

    private MediaDto toDto(Media media) {
        String uploadedDate = media.getUploaded() != null
                ? media.getUploaded().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                : null;
        Long ticketId = media.getTicket() != null ? media.getTicket().getId() : null;
        return new MediaDto(
                media.getId(),
                ticketId,
                media.getFilename(),
                media.getInternalFilename(),
                media.getMimeType(),
                media.getSizeBytes(),
                "/api/media/" + media.getId(),
                "/api/media/" + media.getId() + "/thumbnail",
                uploadedDate
        );
    }
}
