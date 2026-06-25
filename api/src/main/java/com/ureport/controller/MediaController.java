package com.ureport.controller;

import com.ureport.entity.Media;
import com.ureport.security.JwtUserDetails;
import com.ureport.service.MediaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class MediaController {

    private final MediaService mediaService;

    @Autowired
    public MediaController(MediaService mediaService) {
        this.mediaService = mediaService;
    }

    /**
     * POST /api/v1/tickets/{id}/media — upload file
     */
    @PostMapping("/tickets/{id}/media")
    public ResponseEntity<Media> uploadMedia(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal JwtUserDetails userDetails) {
        Integer personId = userDetails != null ? userDetails.getPersonId().intValue() : null;
        Media media = mediaService.upload(id, file, personId);
        return ResponseEntity.ok(media);
    }

    /**
     * GET /api/v1/tickets/{id}/media — list media for ticket
     */
    @GetMapping("/tickets/{id}/media")
    public ResponseEntity<List<Media>> listMedia(@PathVariable Long id) {
        return ResponseEntity.ok(mediaService.listByTicket(id));
    }

    /**
     * DELETE /api/v1/tickets/{id}/media/{mediaId} — delete media (staff only)
     */
    @DeleteMapping("/tickets/{id}/media/{mediaId}")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<Map<String, String>> deleteMedia(
            @PathVariable Long id,
            @PathVariable Long mediaId) {
        mediaService.deleteMedia(mediaId);
        return ResponseEntity.ok(Map.of("status", "deleted"));
    }

    /**
     * GET /api/v1/media/{internalFilename} — serve original file
     */
    @GetMapping("/media/{internalFilename}")
    public ResponseEntity<Resource> serveFile(@PathVariable String internalFilename) {
        Media media = mediaService.findByInternalFilename(internalFilename);
        Resource resource = mediaService.serveFile(internalFilename);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(media.getMimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + media.getFilename() + "\"")
                .body(resource);
    }

    /**
     * GET /api/v1/media/{internalFilename}/thumbnail — serve thumbnail
     */
    @GetMapping("/media/{internalFilename}/thumbnail")
    public ResponseEntity<Resource> serveThumbnail(@PathVariable String internalFilename) {
        Resource resource = mediaService.thumbnail(internalFilename);

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"thumb_" + internalFilename + "\"")
                .body(resource);
    }
}
