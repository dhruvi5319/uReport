package com.ureport.service;

import com.ureport.entity.Media;
import com.ureport.exception.NotFoundException;
import com.ureport.repository.MediaRepository;
import com.ureport.repository.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class MediaService {

    private final MediaRepository mediaRepository;
    private final TicketRepository ticketRepository;
    private final TicketHistoryService ticketHistoryService;
    private final Path mediaPath;

    @Autowired
    public MediaService(MediaRepository mediaRepository,
                        TicketRepository ticketRepository,
                        TicketHistoryService ticketHistoryService,
                        Path mediaPath) {
        this.mediaRepository = mediaRepository;
        this.ticketRepository = ticketRepository;
        this.ticketHistoryService = ticketHistoryService;
        this.mediaPath = mediaPath;
    }

    /**
     * Upload a file to a ticket.
     * Stores file at ${APP_MEDIA_PATH}/{uuid}.{ext}, inserts media row,
     * appends action_id=10 (upload_media) history entry.
     */
    public Media upload(Long ticketId, MultipartFile file, Integer personId) {
        // Validate ticket exists
        if (!ticketRepository.existsById(ticketId)) {
            throw new NotFoundException("TICKET_NOT_FOUND", "Ticket not found: " + ticketId);
        }

        // Generate internal filename
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf('.'));
        }
        String internalFilename = UUID.randomUUID().toString() + extension;

        // Ensure media directory exists
        try {
            Files.createDirectories(mediaPath);
        } catch (IOException e) {
            throw new RuntimeException("Failed to create media directory", e);
        }

        // Write file to disk
        Path filePath = mediaPath.resolve(internalFilename);
        try {
            Files.copy(file.getInputStream(), filePath);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + internalFilename, e);
        }

        // Insert media row
        Media media = new Media();
        media.setTicketId(ticketId);
        media.setOriginalFilename(originalFilename != null ? originalFilename : internalFilename);
        media.setInternalFilename(internalFilename);
        media.setMimeType(file.getContentType() != null ? file.getContentType() : "application/octet-stream");
        media.setFileSize(file.getSize());
        media.setUploadedAt(OffsetDateTime.now());
        media.setUploadedByPersonId(personId);
        media = mediaRepository.save(media);

        // Append upload_media history entry (action_id=10)
        ticketHistoryService.append(ticketId, 10, personId, null,
                "File uploaded: " + (originalFilename != null ? originalFilename : internalFilename), null);

        return media;
    }

    /**
     * Serve original file as a Resource.
     */
    @Transactional(readOnly = true)
    public Resource serveFile(String internalFilename) {
        Media media = mediaRepository.findByInternalFilename(internalFilename)
                .orElseThrow(() -> new NotFoundException("MEDIA_NOT_FOUND",
                        "Media not found: " + internalFilename));

        Path filePath = mediaPath.resolve(media.getInternalFilename());
        if (!Files.exists(filePath)) {
            throw new NotFoundException("FILE_NOT_FOUND", "File not found on disk: " + internalFilename);
        }

        try {
            InputStream is = Files.newInputStream(filePath);
            return new InputStreamResource(is);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read file: " + internalFilename, e);
        }
    }

    /**
     * Serve a thumbnail of the file. Generates on first request, serves cached version thereafter.
     * Returns 404 for non-image files.
     */
    @Transactional(readOnly = true)
    public Resource thumbnail(String internalFilename) {
        Media media = mediaRepository.findByInternalFilename(internalFilename)
                .orElseThrow(() -> new NotFoundException("MEDIA_NOT_FOUND",
                        "Media not found: " + internalFilename));

        // Only support image mime types
        String mimeType = media.getMimeType();
        if (mimeType == null || !mimeType.startsWith("image/")) {
            throw new NotFoundException("NO_THUMBNAIL", "No thumbnail available for non-image files");
        }

        Path thumbnailDir = mediaPath.resolve("thumbnails");
        Path thumbnailPath = thumbnailDir.resolve("thumb_" + internalFilename);

        // Generate thumbnail if it doesn't exist
        if (!Files.exists(thumbnailPath)) {
            generateThumbnail(mediaPath.resolve(internalFilename), thumbnailPath);
        }

        try {
            InputStream is = Files.newInputStream(thumbnailPath);
            return new InputStreamResource(is);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read thumbnail: " + internalFilename, e);
        }
    }

    /**
     * List all media for a ticket.
     */
    @Transactional(readOnly = true)
    public List<Media> listByTicket(Long ticketId) {
        return mediaRepository.findByTicketId(ticketId);
    }

    /**
     * Delete media by ID. Also removes files from disk.
     */
    public void deleteMedia(Long mediaId) {
        Media media = mediaRepository.findById(mediaId)
                .orElseThrow(() -> new NotFoundException("MEDIA_NOT_FOUND", "Media not found: " + mediaId));

        // Delete original file
        Path filePath = mediaPath.resolve(media.getInternalFilename());
        try {
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            // Log but continue — still remove DB record
        }

        // Delete thumbnail if it exists
        Path thumbnailPath = mediaPath.resolve("thumbnails").resolve("thumb_" + media.getInternalFilename());
        try {
            Files.deleteIfExists(thumbnailPath);
        } catch (IOException e) {
            // Ignore thumbnail deletion failures
        }

        mediaRepository.delete(media);
    }

    /**
     * Find media by internal filename (for content-type lookup).
     */
    @Transactional(readOnly = true)
    public Media findByInternalFilename(String internalFilename) {
        return mediaRepository.findByInternalFilename(internalFilename)
                .orElseThrow(() -> new NotFoundException("MEDIA_NOT_FOUND",
                        "Media not found: " + internalFilename));
    }

    // ---- Private helpers ----

    private void generateThumbnail(Path sourcePath, Path thumbnailPath) {
        try {
            Files.createDirectories(thumbnailPath.getParent());
            BufferedImage originalImage = ImageIO.read(sourcePath.toFile());
            if (originalImage == null) {
                throw new RuntimeException("Cannot read image: " + sourcePath);
            }

            int maxDim = 200;
            int origWidth = originalImage.getWidth();
            int origHeight = originalImage.getHeight();

            int thumbWidth, thumbHeight;
            if (origWidth > origHeight) {
                thumbWidth = Math.min(origWidth, maxDim);
                thumbHeight = (int) ((double) origHeight / origWidth * thumbWidth);
            } else {
                thumbHeight = Math.min(origHeight, maxDim);
                thumbWidth = (int) ((double) origWidth / origHeight * thumbHeight);
            }

            if (thumbWidth <= 0) thumbWidth = 1;
            if (thumbHeight <= 0) thumbHeight = 1;

            BufferedImage thumbnail = new BufferedImage(thumbWidth, thumbHeight, BufferedImage.TYPE_INT_RGB);
            Graphics2D g2d = thumbnail.createGraphics();
            g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g2d.drawImage(originalImage, 0, 0, thumbWidth, thumbHeight, null);
            g2d.dispose();

            ImageIO.write(thumbnail, "JPEG", thumbnailPath.toFile());
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate thumbnail: " + sourcePath, e);
        }
    }
}
