package com.ureport.crm.dto;

/**
 * DTO returned when uploading media or listing ticket attachments.
 *
 * <p>url = "/api/media/{id}"
 * <p>thumbnailUrl = "/api/media/{id}/thumbnail"
 */
public record MediaDto(
        Long id,
        Long ticketId,
        String originalFilename,
        String internalFilename,
        String mimeType,
        Long sizeBytes,
        String url,
        String thumbnailUrl,
        String uploadedDate
) {}
