package com.ureport.crm.controller;

import com.ureport.crm.dto.AssignTicketRequest;
import com.ureport.crm.dto.CloseTicketRequest;
import com.ureport.crm.dto.CreateTicketRequest;
import com.ureport.crm.dto.TicketDetailDto;
import com.ureport.crm.dto.TicketHistoryEntryDto;
import com.ureport.crm.dto.UpdateTicketRequest;
import com.ureport.crm.service.TicketHistoryService;
import com.ureport.crm.service.TicketService;
import com.ureport.security.PersonDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller exposing the core ticket lifecycle endpoints.
 *
 * Endpoints per TechArch §4.3:
 * POST   /api/tickets              → 201 TicketDetailDto   (staff/admin only)
 * GET    /api/tickets/{id}         → 200 TicketDetailDto   (any authenticated user)
 * PATCH  /api/tickets/{id}         → 200 TicketDetailDto   (staff/admin only)
 * POST   /api/tickets/{id}/close   → 200 TicketDetailDto   (staff/admin only)
 * POST   /api/tickets/{id}/reopen  → 200 TicketDetailDto   (staff/admin only)
 * POST   /api/tickets/{id}/assign  → 200 TicketDetailDto   (staff/admin only)
 * GET    /api/tickets/{id}/history → 200 List<TicketHistoryEntryDto> (any authenticated user)
 *
 * Security enforced by:
 *   @PreAuthorize on write methods (T-04-02, T-04-05)
 *   JWT required for all /api/** routes via SecurityConfig
 */
@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;
    private final TicketHistoryService ticketHistoryService;

    public TicketController(TicketService ticketService, TicketHistoryService ticketHistoryService) {
        this.ticketService = ticketService;
        this.ticketHistoryService = ticketHistoryService;
    }

    /**
     * POST /api/tickets — create a new ticket.
     * Returns 201 with the created TicketDetailDto.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<TicketDetailDto> createTicket(@RequestBody CreateTicketRequest req) {
        PersonDetails currentUser = currentUser();
        TicketDetailDto dto = ticketService.createTicket(req, currentUser);
        return ResponseEntity.status(201).body(dto);
    }

    /**
     * GET /api/tickets/{id} — retrieve ticket detail including SLA fields.
     * Any authenticated user may access.
     */
    @GetMapping("/{id}")
    public ResponseEntity<TicketDetailDto> getTicket(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getTicket(id));
    }

    /**
     * PATCH /api/tickets/{id} — update mutable ticket fields.
     * Category and location changes create distinct history entries.
     */
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<TicketDetailDto> updateTicket(@PathVariable Long id,
                                                         @RequestBody UpdateTicketRequest req) {
        PersonDetails currentUser = currentUser();
        return ResponseEntity.ok(ticketService.updateTicket(id, req, currentUser));
    }

    /**
     * POST /api/tickets/{id}/close — close an open ticket with a substatus.
     * Duplicate substatus requires parentId.
     */
    @PostMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<TicketDetailDto> closeTicket(@PathVariable Long id,
                                                        @RequestBody CloseTicketRequest req) {
        PersonDetails currentUser = currentUser();
        return ResponseEntity.ok(ticketService.closeTicket(id, req, currentUser));
    }

    /**
     * POST /api/tickets/{id}/reopen — reopen a closed ticket.
     * Clears substatus, closedDate, and parentId.
     */
    @PostMapping("/{id}/reopen")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<TicketDetailDto> reopenTicket(@PathVariable Long id) {
        PersonDetails currentUser = currentUser();
        return ResponseEntity.ok(ticketService.reopenTicket(id, currentUser));
    }

    /**
     * POST /api/tickets/{id}/assign — assign ticket to a person.
     * Creates an "assignment" history entry.
     */
    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<TicketDetailDto> assignTicket(@PathVariable Long id,
                                                         @RequestBody AssignTicketRequest req) {
        PersonDetails currentUser = currentUser();
        return ResponseEntity.ok(ticketService.assignTicket(id, req, currentUser));
    }

    /**
     * GET /api/tickets/{id}/history — return ticket history timeline sorted by entered_date DESC.
     * Delegates to TicketHistoryService.getTimeline() (implemented in plan 04-03).
     */
    @GetMapping("/{id}/history")
    public ResponseEntity<List<TicketHistoryEntryDto>> getHistory(@PathVariable Long id) {
        return ResponseEntity.ok(ticketHistoryService.getTimeline(id));
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
