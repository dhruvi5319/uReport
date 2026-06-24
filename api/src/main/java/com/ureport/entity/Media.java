package com.ureport.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "media")
public class Media {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_id", nullable = false)
    private Long ticketId;

    @Column(name = "internal_filename", nullable = false, length = 255)
    private String internalFilename;

    @Column(name = "original_filename", length = 255)
    private String originalFilename;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "uploaded_at")
    private OffsetDateTime uploadedAt;

    @Column(name = "uploaded_by_person_id")
    private Integer uploadedByPersonId;

    @PrePersist
    protected void onCreate() {
        if (uploadedAt == null) uploadedAt = OffsetDateTime.now();
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTicketId() { return ticketId; }
    public void setTicketId(Long ticketId) { this.ticketId = ticketId; }

    public String getInternalFilename() { return internalFilename; }
    public void setInternalFilename(String internalFilename) { this.internalFilename = internalFilename; }

    public String getOriginalFilename() { return originalFilename; }
    public void setOriginalFilename(String originalFilename) { this.originalFilename = originalFilename; }

    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public OffsetDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(OffsetDateTime uploadedAt) { this.uploadedAt = uploadedAt; }

    public Integer getUploadedByPersonId() { return uploadedByPersonId; }
    public void setUploadedByPersonId(Integer uploadedByPersonId) { this.uploadedByPersonId = uploadedByPersonId; }
}
