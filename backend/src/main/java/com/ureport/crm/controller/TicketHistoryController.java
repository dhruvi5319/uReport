package com.ureport.crm.controller;

import com.ureport.crm.dto.LogActionRequest;
import com.ureport.crm.dto.TicketHistoryEntryDto;
import com.ureport.crm.service.TicketHistoryService;
import com.ureport.security.PersonDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for ticket history.
 *
 * Endpoints per API spec §4.3:
 * GET  /api/tickets/{id}/history  → @Authenticated (any JWT) [handled by TicketController]
 * POST /api/tickets/{id}/history  → STAFF | ADMIN only
 *
 * Note: GET /api/actions and GET /api/categories/{id}/action-responses/{actionId}
 * were moved to ActionController and CategoryController respectively in Phase 05.
 *
 * Security: T-04-14 (history access requires JWT), T-04-16 (POST requires staff+)
 */
@RestController
public class TicketHistoryController {

    private final TicketHistoryService ticketHistoryService;

    public TicketHistoryController(TicketHistoryService ticketHistoryService) {
        this.ticketHistoryService = ticketHistoryService;
    }

    /**
     * POST /api/tickets/{id}/history — log an action on a ticket.
     * Returns 201 with the created TicketHistoryEntryDto.
     * Requires STAFF or ADMIN role (T-04-16).
     *
     * Note: GET /api/tickets/{id}/history is handled by TicketController.getHistory()
     * which delegates to ticketHistoryService.getTimeline().
     */
    @PostMapping("/api/tickets/{id}/history")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<TicketHistoryEntryDto> logAction(@PathVariable Long id,
                                                            @RequestBody LogActionRequest req) {
        PersonDetails currentUser = currentUser();
        TicketHistoryEntryDto dto = ticketHistoryService.logAction(id, req, currentUser);
        return ResponseEntity.status(201).body(dto);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private PersonDetails currentUser() {
        return (PersonDetails) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
    }
}
