package com.ureport.crm.dto;

/**
 * DTO for a single ticket history entry — used by GET /api/tickets/{id}/history.
 */
public class TicketHistoryEntryDto {

    private Long id;
    private Long ticketId;
    private String actionName;
    private String enteredDate;         // ISO 8601
    private String actionDate;          // ISO 8601
    private String notes;
    private String sentNotifications;   // JSON array of email addresses notified
    private TicketDetailDto.RefDto enteredByPerson;
    private TicketDetailDto.RefDto actionPerson;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getTicketId() { return ticketId; }
    public void setTicketId(Long ticketId) { this.ticketId = ticketId; }
    public String getActionName() { return actionName; }
    public void setActionName(String actionName) { this.actionName = actionName; }
    public String getEnteredDate() { return enteredDate; }
    public void setEnteredDate(String enteredDate) { this.enteredDate = enteredDate; }
    public String getActionDate() { return actionDate; }
    public void setActionDate(String actionDate) { this.actionDate = actionDate; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getSentNotifications() { return sentNotifications; }
    public void setSentNotifications(String sentNotifications) { this.sentNotifications = sentNotifications; }
    public TicketDetailDto.RefDto getEnteredByPerson() { return enteredByPerson; }
    public void setEnteredByPerson(TicketDetailDto.RefDto enteredByPerson) { this.enteredByPerson = enteredByPerson; }
    public TicketDetailDto.RefDto getActionPerson() { return actionPerson; }
    public void setActionPerson(TicketDetailDto.RefDto actionPerson) { this.actionPerson = actionPerson; }
}
