package com.ureport.crm.dto;

/**
 * Request body for POST /api/tickets/{id}/close.
 */
public class CloseTicketRequest {

    private Long substatusId;    // required
    private Long parentId;       // required when substatus name = "Duplicate"
    private String notes;
    private Boolean notifyReporter;

    public Long getSubstatusId() { return substatusId; }
    public void setSubstatusId(Long substatusId) { this.substatusId = substatusId; }
    public Long getParentId() { return parentId; }
    public void setParentId(Long parentId) { this.parentId = parentId; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Boolean getNotifyReporter() { return notifyReporter; }
    public void setNotifyReporter(Boolean notifyReporter) { this.notifyReporter = notifyReporter; }
}
