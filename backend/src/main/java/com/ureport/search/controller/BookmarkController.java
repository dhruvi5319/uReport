package com.ureport.search.controller;

import com.ureport.search.dto.BookmarkDto;
import com.ureport.search.dto.CreateBookmarkRequest;
import com.ureport.search.service.BookmarkService;
import com.ureport.security.CustomUserDetails;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for saved bookmarks.
 *
 * All endpoints require a valid JWT (enforced by SecurityConfig — /api/** requires authentication).
 * The personId used for all operations is read exclusively from the JWT principal (T-06-02, T-06-03).
 *
 * Endpoints:
 * GET    /api/bookmarks       → 200 List&lt;BookmarkDto&gt;  (returns only caller's bookmarks)
 * POST   /api/bookmarks       → 201 BookmarkDto         (creates bookmark scoped to caller)
 * DELETE /api/bookmarks/{id}  → 204 (no body)           (403 if non-owner non-admin)
 */
@RestController
@RequestMapping("/api/bookmarks")
public class BookmarkController {

    private final BookmarkService bookmarkService;

    public BookmarkController(BookmarkService bookmarkService) {
        this.bookmarkService = bookmarkService;
    }

    /**
     * GET /api/bookmarks — returns all bookmarks belonging to the authenticated user.
     * personId is read from the JWT principal — not from any URL or query parameter.
     */
    private CustomUserDetails currentUser() {
        return (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @GetMapping
    public List<BookmarkDto> getBookmarks() {
        return bookmarkService.getBookmarks(currentUser().getPersonId());
    }

    /**
     * POST /api/bookmarks — creates a new bookmark for the authenticated user.
     * Returns 201 with the created BookmarkDto.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookmarkDto createBookmark(
            @Valid @RequestBody CreateBookmarkRequest req) {
        return bookmarkService.createBookmark(req, currentUser().getPersonId());
    }

    /**
     * DELETE /api/bookmarks/{id} — deletes a bookmark.
     * Returns 204 NO_CONTENT on success.
     * Returns 403 FORBIDDEN if the caller is not the bookmark owner and not ROLE_ADMIN (T-06-03).
     * Returns 404 NOT_FOUND if no bookmark exists with that id.
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBookmark(@PathVariable Long id) {
        CustomUserDetails cu = currentUser();
        boolean isAdmin = cu.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().contains("ADMIN"));
        bookmarkService.deleteBookmark(id, cu.getPersonId(), isAdmin);
    }
}
