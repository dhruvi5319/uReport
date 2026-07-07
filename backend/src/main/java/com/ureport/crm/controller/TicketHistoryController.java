package com.ureport.crm.controller;

import com.ureport.crm.dto.ActionDto;
import com.ureport.crm.dto.LogActionRequest;
import com.ureport.crm.dto.TicketHistoryEntryDto;
import com.ureport.crm.service.TicketHistoryService;
import com.ureport.domain.Action;
import com.ureport.repository.ActionsRepository;
import com.ureport.security.PersonDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST controller for ticket history, actions list, and response templates.
 *
 * Endpoints per API spec §4.3:
 * GET  /api/tickets/{id}/history                           → @Authenticated (any JWT)
 * POST /api/tickets/{id}/history                           → STAFF | ADMIN only
 * GET  /api/actions                                        → @Authenticated (any JWT)
 * GET  /api/categories/{id}/action-responses/{actionId}    → @Authenticated (any JWT)
 *
 * Security: T-04-14 (history access requires JWT), T-04-16 (POST requires staff+)
 * T-04-17 (response templates require JWT)
 */
@RestController
public class TicketHistoryController {

    private final TicketHistoryService ticketHistoryService;
    private final ActionsRepository actionsRepository;

    public TicketHistoryController(TicketHistoryService ticketHistoryService,
                                    ActionsRepository actionsRepository) {
        this.ticketHistoryService = ticketHistoryService;
        this.actionsRepository = actionsRepository;
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

    /**
     * GET /api/actions — return all action types (system + department).
     * Any authenticated user may access.
     */
    @GetMapping("/api/actions")
    public ResponseEntity<List<ActionDto>> getActions() {
        List<Action> actions = actionsRepository.findAll();
        List<ActionDto> dtos = actions.stream()
                .map(a -> new ActionDto(
                        a.getId(),
                        a.getName(),
                        a.getReplyEmail(),
                        "department".equalsIgnoreCase(a.getType())))
                .toList();
        return ResponseEntity.ok(dtos);
    }

    /**
     * GET /api/categories/{id}/action-responses/{actionId} — returns response template.
     * Returns { "template": "..." } or { "template": null } if not configured.
     * Any authenticated user may access (T-04-17).
     */
    @GetMapping("/api/categories/{id}/action-responses/{actionId}")
    public ResponseEntity<Map<String, Object>> getActionResponse(@PathVariable Long id,
                                                                   @PathVariable Long actionId) {
        String template = ticketHistoryService.getResponseTemplate(id, actionId);
        // Use HashMap to support null value (Map.of does not allow null values)
        Map<String, Object> result = new HashMap<>();
        result.put("template", template);
        return ResponseEntity.ok(result);
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
