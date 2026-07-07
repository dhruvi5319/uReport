package com.ureport.crm.controller;

import com.ureport.crm.dto.BulkOperationResult;
import com.ureport.crm.dto.BulkTicketRequest;
import com.ureport.crm.exception.BusinessException;
import com.ureport.crm.service.TicketBulkService;
import com.ureport.security.PersonDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for POST /api/tickets/bulk
 *
 * Security: STAFF or ADMIN role required (T-04-09).
 * Size guard: ticketIds.size() <= 100 (T-04-08 DoS mitigation).
 */
@RestController
@RequestMapping("/api/tickets")
public class TicketBulkController {

    private static final int BULK_LIMIT = 100;

    private final TicketBulkService ticketBulkService;

    public TicketBulkController(TicketBulkService ticketBulkService) {
        this.ticketBulkService = ticketBulkService;
    }

    /**
     * POST /api/tickets/bulk
     *
     * Routes to bulkAssign / bulkClose / bulkChangeStatus based on req.action.
     * Returns HTTP 200 with BulkOperationResult.
     *
     * Validations:
     * - ticketIds must not be null or empty → 400 TICKETIDS_REQUIRED
     * - ticketIds.size() must be <= 100 → 400 BULK_LIMIT_EXCEEDED (T-04-08)
     * - action must not be null → 400 ACTION_REQUIRED
     * - For action=assign: assignedPersonId must not be null → 400 PERSON_ID_REQUIRED
     * - For action=close:  substatusId must not be null → 400 SUBSTATUS_ID_REQUIRED
     * - For action=changeStatus: status must not be null → 400 STATUS_REQUIRED
     * - Unknown action → 400 UNKNOWN_ACTION
     */
    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<BulkOperationResult> bulk(@RequestBody BulkTicketRequest req) {
        // Validate ticketIds
        if (req.getTicketIds() == null || req.getTicketIds().isEmpty()) {
            throw new BusinessException("TICKETIDS_REQUIRED", "ticketIds must not be empty");
        }

        // T-04-08: DoS guard — reject oversized bulk requests
        if (req.getTicketIds().size() > BULK_LIMIT) {
            throw new BusinessException("BULK_LIMIT_EXCEEDED",
                "ticketIds must not exceed " + BULK_LIMIT + " items, got: " + req.getTicketIds().size());
        }

        if (req.getAction() == null || req.getAction().isBlank()) {
            throw new BusinessException("ACTION_REQUIRED", "action must not be null");
        }

        PersonDetails currentUser = (PersonDetails) SecurityContextHolder
            .getContext().getAuthentication().getPrincipal();

        BulkOperationResult result = switch (req.getAction()) {
            case "assign" -> {
                if (req.getAssignedPersonId() == null) {
                    throw new BusinessException("PERSON_ID_REQUIRED",
                        "assignedPersonId is required for action=assign");
                }
                yield ticketBulkService.bulkAssign(
                    req.getTicketIds(), req.getAssignedPersonId(), currentUser);
            }
            case "close" -> {
                if (req.getSubstatusId() == null) {
                    throw new BusinessException("SUBSTATUS_ID_REQUIRED",
                        "substatusId is required for action=close");
                }
                yield ticketBulkService.bulkClose(
                    req.getTicketIds(), req.getSubstatusId(), null, currentUser);
            }
            case "changeStatus" -> {
                if (req.getStatus() == null || req.getStatus().isBlank()) {
                    throw new BusinessException("STATUS_REQUIRED",
                        "status is required for action=changeStatus");
                }
                yield ticketBulkService.bulkChangeStatus(
                    req.getTicketIds(), req.getStatus(), currentUser);
            }
            default -> throw new BusinessException("UNKNOWN_ACTION",
                "Unknown action: " + req.getAction() + ". Must be assign, close, or changeStatus");
        };

        return ResponseEntity.ok(result);
    }
}
