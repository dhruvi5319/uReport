package com.ureport.search.service;

import com.ureport.domain.Bookmark;
import com.ureport.repository.BookmarkRepository;
import com.ureport.search.dto.BookmarkDto;
import com.ureport.search.dto.CreateBookmarkRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for bookmark CRUD operations.
 *
 * Ownership rules (T-06-02, T-06-03):
 * - getBookmarks: scoped to personId from JWT — no cross-user leakage
 * - createBookmark: personId set from JWT, never from request body
 * - deleteBookmark: throws 403 if caller is not owner AND not ROLE_ADMIN
 */
@Service
@Transactional
public class BookmarkService {

    private final BookmarkRepository bookmarkRepository;

    public BookmarkService(BookmarkRepository bookmarkRepository) {
        this.bookmarkRepository = bookmarkRepository;
    }

    /**
     * Returns all bookmarks belonging to the authenticated user.
     * personId is read from the JWT principal — not from any request parameter.
     */
    @Transactional(readOnly = true)
    public List<BookmarkDto> getBookmarks(Long personId) {
        return bookmarkRepository.findByPersonId(personId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Creates a new bookmark scoped to the authenticated user.
     * personId is set exclusively from the JWT principal (T-06-02).
     */
    public BookmarkDto createBookmark(CreateBookmarkRequest req, Long personId) {
        Bookmark b = new Bookmark();
        b.setPersonId(personId);
        b.setType(req.getType() != null && !req.getType().isBlank() ? req.getType() : "search");
        b.setName(req.getName());
        b.setRequestUri(req.getRequestUri());
        return toDto(bookmarkRepository.save(b));
    }

    /**
     * Deletes a bookmark by id.
     *
     * Ownership check (T-06-03): throws 403 FORBIDDEN if the bookmark belongs to
     * a different person AND the caller does not have ROLE_ADMIN.
     * Throws 404 NOT_FOUND if no bookmark with the given id exists.
     */
    public void deleteBookmark(Long id, Long personId, boolean isAdmin) {
        Bookmark b = bookmarkRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Bookmark not found: " + id));
        if (!b.getPersonId().equals(personId) && !isAdmin) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Not bookmark owner");
        }
        bookmarkRepository.delete(b);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private BookmarkDto toDto(Bookmark b) {
        return new BookmarkDto(b.getId(), b.getType(), b.getName(), b.getRequestUri());
    }
}
