package com.ureport.crm.controller;

import com.ureport.crm.dto.MediaDto;
import com.ureport.crm.service.MediaService;
import com.ureport.security.PersonDetails;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * REST controller for ticket media operations.
 *
 * Endpoints:
 * POST   /api/tickets/{id}/media              → upload files (STAFF|ADMIN)
 * GET    /api/tickets/{id}/media              → list attachments (authenticated)
 * DELETE /api/tickets/{id}/media/{mediaId}    → delete attachment (STAFF|ADMIN)
 * GET    /api/media/{mediaId}                 → stream full-resolution file (public)
 * GET    /api/media/{mediaId}/thumbnail       → stream 150x150 thumbnail (public)
 *
 * Security:
 * - Upload and delete require STAFF or ADMIN role
 * - List requires authentication (JWT present)
 * - Serve endpoints are public (Open311 design: public categories have public media)
 */
@RestController
public class TicketMediaController {

    private final MediaService mediaService;

    public TicketMediaController(MediaService mediaService) {
        this.mediaService = mediaService;
    }

    // -----------------------------------------------------------------------
    // Upload
    // -----------------------------------------------------------------------

    /**
     * POST /api/tickets/{id}/media — upload one or more image files for a ticket.
     * Returns HTTP 200 with List<MediaDto>.
     */
    @PostMapping("/api/tickets/{id}/media")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<List<MediaDto>> uploadMedia(
            @PathVariable Long id,
            @RequestParam("files") List<MultipartFile> files) {
        PersonDetails currentUser = currentUser();
        List<MediaDto> result = mediaService.upload(id, files, currentUser);
        return ResponseEntity.ok(result);
    }

    // -----------------------------------------------------------------------
    // List
    // -----------------------------------------------------------------------

    /**
     * GET /api/tickets/{id}/media — list all attachments for a ticket.
     * Any authenticated user may access.
     */
    @GetMapping("/api/tickets/{id}/media")
    public ResponseEntity<List<MediaDto>> listMedia(@PathVariable Long id) {
        return ResponseEntity.ok(mediaService.listForTicket(id));
    }

    // -----------------------------------------------------------------------
    // Delete
    // -----------------------------------------------------------------------

    /**
     * DELETE /api/tickets/{id}/media/{mediaId} — remove an attachment.
     * Returns HTTP 204 on success.
     */
    @DeleteMapping("/api/tickets/{id}/media/{mediaId}")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<Void> deleteMedia(
            @PathVariable Long id,
            @PathVariable Long mediaId) {
        PersonDetails currentUser = currentUser();
        mediaService.deleteMedia(mediaId, currentUser);
        return ResponseEntity.noContent().build();
    }

    // -----------------------------------------------------------------------
    // Serve (public — no auth required)
    // -----------------------------------------------------------------------

    /**
     * GET /api/media/{mediaId} — stream the full-resolution file.
     * Public endpoint per Open311 design (T-04-20).
     */
    @GetMapping("/api/media/{mediaId}")
    public ResponseEntity<Resource> serveMedia(@PathVariable Long mediaId) {
        return mediaService.serveMedia(mediaId, false);
    }

    /**
     * GET /api/media/{mediaId}/thumbnail — stream the 150x150 JPEG thumbnail.
     * Public endpoint per Open311 design (T-04-20).
     */
    @GetMapping("/api/media/{mediaId}/thumbnail")
    public ResponseEntity<Resource> serveThumbnail(@PathVariable Long mediaId) {
        return mediaService.serveMedia(mediaId, true);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private PersonDetails currentUser() {
        return (PersonDetails) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
    }
}
