package com.ureport.crm.dto;

import java.util.List;

/**
 * Response DTO for POST /api/tickets/bulk
 *
 * Contains aggregate counts and per-ticket breakdown of bulk operation outcomes.
 */
public class BulkOperationResult {

    private int successCount;
    private int failureCount;
    private List<TicketOperationResult> perTicketResults;

    public BulkOperationResult() {}

    public BulkOperationResult(int successCount, int failureCount,
                                List<TicketOperationResult> perTicketResults) {
        this.successCount = successCount;
        this.failureCount = failureCount;
        this.perTicketResults = perTicketResults;
    }

    public int getSuccessCount() { return successCount; }
    public void setSuccessCount(int successCount) { this.successCount = successCount; }
    public int getFailureCount() { return failureCount; }
    public void setFailureCount(int failureCount) { this.failureCount = failureCount; }
    public List<TicketOperationResult> getPerTicketResults() { return perTicketResults; }
    public void setPerTicketResults(List<TicketOperationResult> perTicketResults) {
        this.perTicketResults = perTicketResults;
    }

    /**
     * Per-ticket outcome record.
     */
    public static class TicketOperationResult {
        private Long ticketId;
        private boolean success;
        private String error; // null on success

        public TicketOperationResult() {}

        public TicketOperationResult(Long ticketId, boolean success, String error) {
            this.ticketId = ticketId;
            this.success = success;
            this.error = error;
        }

        public Long getTicketId() { return ticketId; }
        public void setTicketId(Long ticketId) { this.ticketId = ticketId; }
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }
}
