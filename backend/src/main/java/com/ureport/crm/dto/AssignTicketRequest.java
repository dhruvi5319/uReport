package com.ureport.crm.dto;

/**
 * Request body for POST /api/tickets/{id}/assign.
 */
public class AssignTicketRequest {

    private Long personId;        // required; must be active staff person
    private String notes;
    private Boolean notifyAssignee;

    public Long getPersonId() { return personId; }
    public void setPersonId(Long personId) { this.personId = personId; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Boolean getNotifyAssignee() { return notifyAssignee; }
    public void setNotifyAssignee(Boolean notifyAssignee) { this.notifyAssignee = notifyAssignee; }
}
