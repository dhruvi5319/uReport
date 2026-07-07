package com.ureport.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "media")
public class Media {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id")
    private Ticket ticket;

    private String filename;

    @Column(name = "internal_filename")
    private String internalFilename;

    @Column(name = "mime_type")
    private String mimeType;

    private LocalDateTime uploaded;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_id")
    private Person person;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Ticket getTicket() { return ticket; }
    public void setTicket(Ticket ticket) { this.ticket = ticket; }
    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }
    public String getInternalFilename() { return internalFilename; }
    public void setInternalFilename(String internalFilename) { this.internalFilename = internalFilename; }
    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }
    public LocalDateTime getUploaded() { return uploaded; }
    public void setUploaded(LocalDateTime uploaded) { this.uploaded = uploaded; }
    public Person getPerson() { return person; }
    public void setPerson(Person person) { this.person = person; }
}
