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

    @Column(name = "filename", nullable = false, length = 255)
    private String filename;

    @Column(name = "internalFilename", nullable = false, length = 255)
    private String internalFilename;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "uploaded")
    private OffsetDateTime uploaded;

    @Column(name = "person_id")
    private Integer personId;

    @PrePersist
    protected void onCreate() {
        if (uploaded == null) uploaded = OffsetDateTime.now();
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTicketId() { return ticketId; }
    public void setTicketId(Long ticketId) { this.ticketId = ticketId; }

    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }

    public String getInternalFilename() { return internalFilename; }
    public void setInternalFilename(String internalFilename) { this.internalFilename = internalFilename; }

    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }

    public OffsetDateTime getUploaded() { return uploaded; }
    public void setUploaded(OffsetDateTime uploaded) { this.uploaded = uploaded; }

    public Integer getPersonId() { return personId; }
    public void setPersonId(Integer personId) { this.personId = personId; }
}
