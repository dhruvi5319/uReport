package com.ureport.crm.dto;

import java.util.List;

/**
 * Request body for POST /api/tickets/bulk
 * Spec:
 *   ticketIds:        required, min 1 element
 *   action:           required — "assign" | "close" | "changeStatus"
 *   assignedPersonId: for action=assign
 *   substatusId:      for action=close
 *   status:           for action=changeStatus ("open" | "closed")
 */
public class BulkTicketRequest {

    private List<Long> ticketIds;
    private String action;
    private Long assignedPersonId;
    private Long substatusId;
    private String status;

    public List<Long> getTicketIds() { return ticketIds; }
    public void setTicketIds(List<Long> ticketIds) { this.ticketIds = ticketIds; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public Long getAssignedPersonId() { return assignedPersonId; }
    public void setAssignedPersonId(Long assignedPersonId) { this.assignedPersonId = assignedPersonId; }
    public Long getSubstatusId() { return substatusId; }
    public void setSubstatusId(Long substatusId) { this.substatusId = substatusId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
