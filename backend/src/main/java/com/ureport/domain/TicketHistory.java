package com.ureport.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_history")
public class TicketHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id")
    private Ticket ticket;

    @Column(name = "entered_by_person_id")
    private Long enteredByPersonId;

    @Column(name = "action_person_id")
    private Long actionPersonId;

    @Column(name = "action_id")
    private Long actionId;

    @Column(name = "entered_date")
    private LocalDateTime enteredDate;

    @Column(name = "action_date")
    private LocalDateTime actionDate;

    private String notes;
    private String data;

    @Column(name = "sent_notifications")
    private String sentNotifications;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Ticket getTicket() { return ticket; }
    public void setTicket(Ticket ticket) { this.ticket = ticket; }
    public Long getEnteredByPersonId() { return enteredByPersonId; }
    public void setEnteredByPersonId(Long enteredByPersonId) { this.enteredByPersonId = enteredByPersonId; }
    public Long getActionPersonId() { return actionPersonId; }
    public void setActionPersonId(Long actionPersonId) { this.actionPersonId = actionPersonId; }
    public Long getActionId() { return actionId; }
    public void setActionId(Long actionId) { this.actionId = actionId; }
    public LocalDateTime getEnteredDate() { return enteredDate; }
    public void setEnteredDate(LocalDateTime enteredDate) { this.enteredDate = enteredDate; }
    public LocalDateTime getActionDate() { return actionDate; }
    public void setActionDate(LocalDateTime actionDate) { this.actionDate = actionDate; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getData() { return data; }
    public void setData(String data) { this.data = data; }
    public String getSentNotifications() { return sentNotifications; }
    public void setSentNotifications(String sentNotifications) { this.sentNotifications = sentNotifications; }
}
