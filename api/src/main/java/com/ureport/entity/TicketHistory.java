package com.ureport.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "ticketHistory")
public class TicketHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_id", nullable = false)
    private Long ticketId;

    @Column(name = "enteredByPerson_id")
    private Integer enteredByPersonId;

    @Column(name = "actionPerson_id")
    private Integer actionPersonId;

    @Column(name = "action_id", nullable = false)
    private Integer actionId;

    @Column(name = "enteredDate")
    private OffsetDateTime enteredDate;

    @Column(name = "actionDate")
    private OffsetDateTime actionDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "data", columnDefinition = "TEXT")
    private String data;

    @Column(name = "sentNotifications")
    private String sentNotifications;

    @PrePersist
    protected void onCreate() {
        if (enteredDate == null) enteredDate = OffsetDateTime.now();
        if (actionDate == null) actionDate = OffsetDateTime.now();
    }

    // Getters and setters — NO setters for id (generated) or PrePersist fields that are auto-set
    public Long getId() { return id; }

    public Long getTicketId() { return ticketId; }
    public void setTicketId(Long ticketId) { this.ticketId = ticketId; }

    public Integer getEnteredByPersonId() { return enteredByPersonId; }
    public void setEnteredByPersonId(Integer enteredByPersonId) { this.enteredByPersonId = enteredByPersonId; }

    public Integer getActionPersonId() { return actionPersonId; }
    public void setActionPersonId(Integer actionPersonId) { this.actionPersonId = actionPersonId; }

    public Integer getActionId() { return actionId; }
    public void setActionId(Integer actionId) { this.actionId = actionId; }

    public OffsetDateTime getEnteredDate() { return enteredDate; }
    public void setEnteredDate(OffsetDateTime enteredDate) { this.enteredDate = enteredDate; }

    public OffsetDateTime getActionDate() { return actionDate; }
    public void setActionDate(OffsetDateTime actionDate) { this.actionDate = actionDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getData() { return data; }
    public void setData(String data) { this.data = data; }

    public String getSentNotifications() { return sentNotifications; }
    public void setSentNotifications(String sentNotifications) { this.sentNotifications = sentNotifications; }
}
