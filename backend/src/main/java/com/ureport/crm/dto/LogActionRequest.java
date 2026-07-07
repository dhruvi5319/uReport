package com.ureport.crm.dto;

/**
 * Request body for POST /api/tickets/{id}/history.
 *
 * actionId: required; must reference a valid department action
 * notes: required when action.name = "response" (NOTES_REQUIRED → 400)
 * notifyReporter: triggers email to reporter's notification addresses
 * notifyAssignee: triggers email to assignee's notification addresses
 * actionPersonId: defaults to current authenticated user if null
 */
public class LogActionRequest {

    private Long actionId;
    private String notes;
    private Boolean notifyReporter;
    private Boolean notifyAssignee;
    private Long actionPersonId;

    public Long getActionId() { return actionId; }
    public void setActionId(Long actionId) { this.actionId = actionId; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Boolean getNotifyReporter() { return notifyReporter; }
    public void setNotifyReporter(Boolean notifyReporter) { this.notifyReporter = notifyReporter; }
    public Boolean getNotifyAssignee() { return notifyAssignee; }
    public void setNotifyAssignee(Boolean notifyAssignee) { this.notifyAssignee = notifyAssignee; }
    public Long getActionPersonId() { return actionPersonId; }
    public void setActionPersonId(Long actionPersonId) { this.actionPersonId = actionPersonId; }
}
