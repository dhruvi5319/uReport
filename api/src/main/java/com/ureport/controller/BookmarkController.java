package com.ureport.controller;

import com.ureport.entity.Bookmark;
import com.ureport.security.JwtUserDetails;
import com.ureport.service.BookmarkService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/bookmarks")
@PreAuthorize("hasRole('STAFF')")
public class BookmarkController {

    private final BookmarkService bookmarkService;

    @Autowired
    public BookmarkController(BookmarkService bookmarkService) {
        this.bookmarkService = bookmarkService;
    }

    /**
     * POST /api/v1/bookmarks — create a bookmark
     */
    @PostMapping
    public ResponseEntity<Bookmark> createBookmark(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal JwtUserDetails userDetails) {
        Integer personId = userDetails.getPersonId().intValue();
        String name = body.get("name");
        String requestUri = body.get("requestUri");
        String type = body.get("type");
        Bookmark bookmark = bookmarkService.createBookmark(personId, name, requestUri, type);
        return ResponseEntity.ok(bookmark);
    }

    /**
     * GET /api/v1/bookmarks — list bookmarks for authenticated user
     */
    @GetMapping
    public ResponseEntity<List<Bookmark>> listBookmarks(
            @AuthenticationPrincipal JwtUserDetails userDetails) {
        Integer personId = userDetails.getPersonId().intValue();
        return ResponseEntity.ok(bookmarkService.listBookmarks(personId));
    }

    /**
     * DELETE /api/v1/bookmarks/{id} — delete bookmark (owner-only)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteBookmark(
            @PathVariable Integer id,
            @AuthenticationPrincipal JwtUserDetails userDetails) {
        Integer personId = userDetails.getPersonId().intValue();
        bookmarkService.deleteBookmark(id, personId);
        return ResponseEntity.ok(Map.of("status", "deleted"));
    }
}
