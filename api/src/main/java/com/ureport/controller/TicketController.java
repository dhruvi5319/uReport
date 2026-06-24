package com.ureport.controller;

import com.ureport.dto.request.CloseTicketRequest;
import com.ureport.dto.request.CreateTicketRequest;
import com.ureport.dto.request.UpdateTicketRequest;
import com.ureport.dto.response.TicketResponse;
import com.ureport.entity.Category;
import com.ureport.repository.CategoryRepository;
import com.ureport.security.JwtUserDetails;
import com.ureport.security.PermissionEvaluator;
import com.ureport.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/tickets")
public class TicketController {

    private final TicketService ticketService;
    private final CategoryRepository categoryRepository;
    private final PermissionEvaluator permissionEvaluator;

    public TicketController(TicketService ticketService,
                            CategoryRepository categoryRepository,
                            PermissionEvaluator permissionEvaluator) {
        this.ticketService = ticketService;
        this.categoryRepository = categoryRepository;
        this.permissionEvaluator = permissionEvaluator;
    }

    /**
     * POST /api/v1/tickets — Create a new ticket (staff/public/anonymous per category posting permission).
     */
    @PostMapping
    public ResponseEntity<TicketResponse> createTicket(@Valid @RequestBody CreateTicketRequest request) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        Integer enteredByPersonId = null;
        String callerRole = "anonymous";

        if (auth != null && auth.getPrincipal() instanceof JwtUserDetails userDetails) {
            enteredByPersonId = userDetails.getPersonId().intValue();
            callerRole = userDetails.getRole();
        }

        var ticket = ticketService.createTicket(request, enteredByPersonId, callerRole);
        return ResponseEntity.status(HttpStatus.CREATED).body(TicketResponse.from(ticket));
    }

    /**
     * GET /api/v1/tickets/{id} — Get a ticket (role-based display permission check).
     */
    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicket(@PathVariable Long id) {
        var ticket = ticketService.getTicket(id);

        // Check display permission for the ticket's category
        String callerRole = "anonymous";
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof JwtUserDetails userDetails) {
            callerRole = userDetails.getRole();
        }

        var categoryOpt = categoryRepository.findById(ticket.getCategoryId());
        if (categoryOpt.isPresent()) {
            Category category = categoryOpt.get();
            if (!permissionEvaluator.isAllowed(callerRole, category.getDisplayPermissionLevel())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }

        return ResponseEntity.ok(TicketResponse.from(ticket));
    }

    /**
     * PATCH /api/v1/tickets/{id} — Update ticket fields (staff only).
     */
    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<TicketResponse> updateTicket(@PathVariable Long id,
                                                        @RequestBody UpdateTicketRequest request) {
        Integer staffPersonId = getStaffPersonId();
        var ticket = ticketService.updateTicket(id, request, staffPersonId);
        return ResponseEntity.ok(TicketResponse.from(ticket));
    }

    /**
     * PATCH /api/v1/tickets/{id}/assign — Assign ticket to a staff person (staff only).
     */
    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<TicketResponse> assignTicket(@PathVariable Long id,
                                                        @RequestBody Map<String, Integer> request) {
        Integer assignedPersonId = request.get("assignedPersonId");
        Integer staffPersonId = getStaffPersonId();
        var ticket = ticketService.assignTicket(id, assignedPersonId, staffPersonId);
        return ResponseEntity.ok(TicketResponse.from(ticket));
    }

    /**
     * PATCH /api/v1/tickets/{id}/close — Close ticket (staff only).
     */
    @PatchMapping("/{id}/close")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<TicketResponse> closeTicket(@PathVariable Long id,
                                                       @Valid @RequestBody CloseTicketRequest request) {
        Integer staffPersonId = getStaffPersonId();
        var ticket = ticketService.closeTicket(id, request, staffPersonId);
        return ResponseEntity.ok(TicketResponse.from(ticket));
    }

    /**
     * PATCH /api/v1/tickets/{id}/reopen — Reopen a closed ticket (staff only).
     */
    @PatchMapping("/{id}/reopen")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<TicketResponse> reopenTicket(@PathVariable Long id,
                                                        @RequestBody(required = false) Map<String, String> request) {
        Integer staffPersonId = getStaffPersonId();
        String reason = request != null ? request.get("reason") : null;
        var ticket = ticketService.reopenTicket(id, reason, staffPersonId);
        return ResponseEntity.ok(TicketResponse.from(ticket));
    }

    /**
     * PATCH /api/v1/tickets/{id}/duplicate — Mark ticket as duplicate (staff only).
     */
    @PatchMapping("/{id}/duplicate")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<TicketResponse> markDuplicate(@PathVariable Long id,
                                                         @RequestBody Map<String, Long> request) {
        Long parentId = request.get("parentId");
        Integer staffPersonId = getStaffPersonId();
        var ticket = ticketService.markDuplicate(id, parentId, staffPersonId);
        return ResponseEntity.ok(TicketResponse.from(ticket));
    }

    /**
     * POST /api/v1/tickets/{id}/comments — Add a comment (staff only).
     */
    @PostMapping("/{id}/comments")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<Void> addComment(@PathVariable Long id,
                                            @RequestBody Map<String, String> request) {
        Integer personId = getStaffPersonId();
        ticketService.addComment(id, request.get("notes"), personId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /**
     * DELETE /api/v1/tickets/{id} — Delete ticket (staff only).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<Void> deleteTicket(@PathVariable Long id) {
        ticketService.deleteTicket(id);
        return ResponseEntity.noContent().build();
    }

    private Integer getStaffPersonId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof JwtUserDetails userDetails) {
            return userDetails.getPersonId().intValue();
        }
        return null;
    }
}
