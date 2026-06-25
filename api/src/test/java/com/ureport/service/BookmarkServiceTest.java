package com.ureport.service;

import com.ureport.entity.Bookmark;
import com.ureport.exception.NotFoundException;
import com.ureport.exception.PermissionDeniedException;
import com.ureport.repository.BookmarkRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookmarkServiceTest {

    @Mock
    private BookmarkRepository bookmarkRepository;

    private BookmarkService bookmarkService;

    @BeforeEach
    void setUp() {
        bookmarkService = new BookmarkService(bookmarkRepository);
    }

    @Test
    void testDeleteBookmark_ownerSucceeds() {
        // Arrange
        Integer bookmarkId = 1;
        Integer personId = 42;

        Bookmark bookmark = new Bookmark();
        bookmark.setId(bookmarkId);
        bookmark.setPersonId(personId);
        bookmark.setName("My Search");
        bookmark.setRequestUri("/api/v1/tickets?status=open");

        when(bookmarkRepository.findById(bookmarkId)).thenReturn(Optional.of(bookmark));

        // Act
        bookmarkService.deleteBookmark(bookmarkId, personId);

        // Assert
        verify(bookmarkRepository).delete(bookmark);
    }

    @Test
    void testDeleteBookmark_nonOwnerThrowsPermissionDenied() {
        // Arrange
        Integer bookmarkId = 1;
        Integer ownerId = 42;
        Integer callerId = 99; // different person

        Bookmark bookmark = new Bookmark();
        bookmark.setId(bookmarkId);
        bookmark.setPersonId(ownerId);
        bookmark.setName("Owner's Search");
        bookmark.setRequestUri("/api/v1/tickets?status=open");

        when(bookmarkRepository.findById(bookmarkId)).thenReturn(Optional.of(bookmark));

        // Act & Assert
        PermissionDeniedException ex = assertThrows(PermissionDeniedException.class,
                () -> bookmarkService.deleteBookmark(bookmarkId, callerId));

        assertEquals("PERMISSION_DENIED", ex.getErrorCode());
        verify(bookmarkRepository, never()).delete(any());
    }

    @Test
    void testDeleteBookmark_notFound_throwsNotFoundException() {
        // Arrange
        when(bookmarkRepository.findById(999)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(NotFoundException.class,
                () -> bookmarkService.deleteBookmark(999, 42));
    }

    @Test
    void testListBookmarks_returnsSortedByCreatedAt() {
        // Arrange
        Integer personId = 42;
        OffsetDateTime now = OffsetDateTime.now();

        Bookmark newer = new Bookmark();
        newer.setId(2);
        newer.setPersonId(personId);
        newer.setName("Newer");
        newer.setRequestUri("/api/v1/tickets?status=closed");
        newer.setCreatedAt(now);

        Bookmark older = new Bookmark();
        older.setId(1);
        older.setPersonId(personId);
        older.setName("Older");
        older.setRequestUri("/api/v1/tickets?status=open");
        older.setCreatedAt(now.minusDays(1));

        // Repository returns newest first (as per findByPersonIdOrderByCreatedAtDesc)
        when(bookmarkRepository.findByPersonIdOrderByCreatedAtDesc(personId))
                .thenReturn(List.of(newer, older));

        // Act
        List<Bookmark> result = bookmarkService.listBookmarks(personId);

        // Assert
        assertEquals(2, result.size());
        assertEquals("Newer", result.get(0).getName());
        assertEquals("Older", result.get(1).getName());
    }

    @Test
    void testCreateBookmark_setsPersonIdAndDefaults() {
        // Arrange
        Integer personId = 42;
        when(bookmarkRepository.save(any(Bookmark.class))).thenAnswer(inv -> {
            Bookmark b = inv.getArgument(0);
            b.setId(1);
            return b;
        });

        // Act
        Bookmark result = bookmarkService.createBookmark(personId, "My Bookmark",
                "/api/v1/tickets?assignedTo=me", null);

        // Assert
        assertNotNull(result);
        assertEquals(personId, result.getPersonId());
        assertEquals("search", result.getType()); // default type
    }
}
