package com.ureport.controller;

import com.ureport.dto.response.HistoryEntryResponse;
import com.ureport.exception.NotFoundException;
import com.ureport.service.TicketHistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tickets")
public class TicketHistoryController {

    private final TicketHistoryService ticketHistoryService;

    public TicketHistoryController(TicketHistoryService ticketHistoryService) {
        this.ticketHistoryService = ticketHistoryService;
    }

    /**
     * GET /api/v1/tickets/{id}/history — Returns all history entries for a ticket (staff only).
     * Entries are ordered by enteredDate ASC with renderedDescription populated.
     */
    @GetMapping("/{id}/history")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<List<HistoryEntryResponse>> getHistory(@PathVariable Long id) {
        List<HistoryEntryResponse> history = ticketHistoryService.getHistory(id);
        return ResponseEntity.ok(history);
    }

    /**
     * GET /api/v1/tickets/{id}/history/{historyId} — Returns a single history entry (staff only).
     */
    @GetMapping("/{id}/history/{historyId}")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<HistoryEntryResponse> getHistoryEntry(@PathVariable Long id,
                                                                 @PathVariable Long historyId) {
        return ticketHistoryService.getHistoryEntry(id, historyId)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new NotFoundException("HISTORY_NOT_FOUND",
                        "History entry not found: " + historyId));
    }
}
