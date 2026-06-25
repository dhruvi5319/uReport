package com.ureport.service;

import com.ureport.entity.Media;
import com.ureport.entity.Ticket;
import com.ureport.exception.NotFoundException;
import com.ureport.repository.MediaRepository;
import com.ureport.repository.TicketRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MediaServiceTest {

    @Mock
    private MediaRepository mediaRepository;

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private TicketHistoryService ticketHistoryService;

    @TempDir
    Path tempDir;

    private MediaService mediaService;

    @BeforeEach
    void setUp() {
        mediaService = new MediaService(mediaRepository, ticketRepository, ticketHistoryService, tempDir);
    }

    @Test
    void testUpload_storesFileAndCreatesMediaRow() {
        // Arrange
        Long ticketId = 1L;
        Integer personId = 42;
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.jpg", "image/jpeg", "fake image content".getBytes());

        when(ticketRepository.existsById(ticketId)).thenReturn(true);
        when(mediaRepository.save(any(Media.class))).thenAnswer(inv -> {
            Media m = inv.getArgument(0);
            m.setId(100L);
            return m;
        });

        // Act
        Media result = mediaService.upload(ticketId, file, personId);

        // Assert
        assertNotNull(result);
        assertEquals(ticketId, result.getTicketId());
        assertEquals("test.jpg", result.getFilename());
        assertEquals("image/jpeg", result.getMimeType());
        assertEquals(personId, result.getPersonId());
        assertNotNull(result.getInternalFilename());

        // Verify history appended with action_id=10
        verify(ticketHistoryService).append(eq(ticketId), eq(10), eq(personId),
                isNull(), anyString(), isNull());
        verify(mediaRepository).save(any(Media.class));
    }

    @Test
    void testUpload_nonExistentTicket_throwsNotFoundException() {
        // Arrange
        Long ticketId = 999L;
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.jpg", "image/jpeg", "content".getBytes());

        when(ticketRepository.existsById(ticketId)).thenReturn(false);

        // Act & Assert
        assertThrows(NotFoundException.class, () -> mediaService.upload(ticketId, file, 1));
    }

    @Test
    void testListByTicket_returnsMediaForTicket() {
        // Arrange
        Long ticketId = 1L;
        Media m1 = new Media();
        m1.setId(1L);
        m1.setTicketId(ticketId);

        when(mediaRepository.findByTicketId(ticketId)).thenReturn(List.of(m1));

        // Act
        List<Media> result = mediaService.listByTicket(ticketId);

        // Assert
        assertEquals(1, result.size());
        assertEquals(ticketId, result.get(0).getTicketId());
    }

    @Test
    void testServeFile_mediaNotFound_throwsNotFoundException() {
        // Arrange
        when(mediaRepository.findByInternalFilename("missing.jpg")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(NotFoundException.class, () -> mediaService.serveFile("missing.jpg"));
    }

    @Test
    void testThumbnail_nonImageFile_throwsNotFoundException() {
        // Arrange
        Media media = new Media();
        media.setInternalFilename("doc.pdf");
        media.setMimeType("application/pdf");

        when(mediaRepository.findByInternalFilename("doc.pdf")).thenReturn(Optional.of(media));

        // Act & Assert
        assertThrows(NotFoundException.class, () -> mediaService.thumbnail("doc.pdf"));
    }
}
