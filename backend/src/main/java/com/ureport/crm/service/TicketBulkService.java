package com.ureport.crm.service;

import com.ureport.crm.dto.BulkOperationResult;
import com.ureport.crm.dto.BulkOperationResult.TicketOperationResult;
import com.ureport.crm.exception.BusinessException;
import com.ureport.domain.Person;
import com.ureport.domain.Substatus;
import com.ureport.domain.Ticket;
import com.ureport.domain.TicketHistory;
import com.ureport.repository.ActionsRepository;
import com.ureport.repository.PersonRepository;
import com.ureport.repository.SubstatusRepository;
import com.ureport.repository.TicketHistoryRepository;
import com.ureport.repository.TicketRepository;
import com.ureport.security.PersonDetails;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Bulk ticket operations service — assign, close, changeStatus.
 *
 * Key design constraints:
 * - NO class-level @Transactional on bulk methods: per-ticket isolation is intentional.
 *   A single ticket failure must not roll back other tickets.
 * - Each successfully mutated ticket gets its own ticket_history row.
 * - T-04-10 compliance: every mutated ticket produces an audit trail entry.
 */
@Service
public class TicketBulkService {

    private final TicketRepository ticketRepository;
    private final TicketHistoryRepository ticketHistoryRepository;
    private final PersonRepository personRepository;
    private final SubstatusRepository substatusRepository;
    private final ActionsRepository actionsRepository;

    public TicketBulkService(TicketRepository ticketRepository,
                              TicketHistoryRepository ticketHistoryRepository,
                              PersonRepository personRepository,
                              SubstatusRepository substatusRepository,
                              ActionsRepository actionsRepository) {
        this.ticketRepository = ticketRepository;
        this.ticketHistoryRepository = ticketHistoryRepository;
        this.personRepository = personRepository;
        this.substatusRepository = substatusRepository;
        this.actionsRepository = actionsRepository;
    }

    /**
     * Bulk assign tickets to a person.
     *
     * Validates that personId is a valid Person first (400 if not).
     * Then processes each ticket individually in a try/catch — one failure
     * does not stop the remaining tickets.
     *
     * @param ticketIds   list of ticket IDs to assign
     * @param personId    ID of person to assign
     * @param currentUser currently authenticated user (for audit trail)
     * @return BulkOperationResult with successCount, failureCount, and per-ticket detail
     */
    public BulkOperationResult bulkAssign(List<Long> ticketIds, Long personId,
                                           PersonDetails currentUser) {
        // Validate personId up-front (fail fast if the target person doesn't exist)
        Person person = personRepository.findById(personId)
            .orElseThrow(() -> new BusinessException("PERSON_NOT_FOUND",
                "Person not found: " + personId));

        Long assignmentActionId = findActionId("assignment");

        List<TicketOperationResult> results = new ArrayList<>();
        int successCount = 0;
        int failureCount = 0;

        for (Long ticketId : ticketIds) {
            try {
                Ticket ticket = ticketRepository.findById(ticketId).orElse(null);
                if (ticket == null) {
                    results.add(new TicketOperationResult(ticketId, false, "TICKET_NOT_FOUND"));
                    failureCount++;
                    continue;
                }

                ticket.setAssignedPerson(person);
                ticket.setLastModified(LocalDateTime.now());
                ticketRepository.save(ticket);

                TicketHistory history = new TicketHistory();
                history.setTicket(ticket);
                history.setActionId(assignmentActionId);
                history.setEnteredByPersonId(currentUser.getId());
                history.setEnteredDate(LocalDateTime.now());
                history.setActionDate(LocalDateTime.now());
                ticketHistoryRepository.save(history);

                results.add(new TicketOperationResult(ticketId, true, null));
                successCount++;
            } catch (Exception ex) {
                results.add(new TicketOperationResult(ticketId, false, ex.getMessage()));
                failureCount++;
            }
        }

        return new BulkOperationResult(successCount, failureCount, results);
    }

    /**
     * Bulk close tickets.
     *
     * Validates that substatusId is valid first (400 if not).
     * Then processes each ticket individually — already-closed tickets are recorded as failures.
     *
     * @param ticketIds   list of ticket IDs to close
     * @param substatusId ID of the substatus to apply
     * @param notes       optional notes for ticket_history
     * @param currentUser currently authenticated user (for audit trail)
     * @return BulkOperationResult
     */
    public BulkOperationResult bulkClose(List<Long> ticketIds, Long substatusId,
                                          String notes, PersonDetails currentUser) {
        Substatus substatus = substatusRepository.findById(substatusId)
            .orElseThrow(() -> new BusinessException("SUBSTATUS_NOT_FOUND",
                "Substatus not found: " + substatusId));

        Long closedActionId = findActionId("closed");

        List<TicketOperationResult> results = new ArrayList<>();
        int successCount = 0;
        int failureCount = 0;

        for (Long ticketId : ticketIds) {
            try {
                Ticket ticket = ticketRepository.findById(ticketId).orElse(null);
                if (ticket == null) {
                    results.add(new TicketOperationResult(ticketId, false, "TICKET_NOT_FOUND"));
                    failureCount++;
                    continue;
                }
                if ("closed".equals(ticket.getStatus())) {
                    results.add(new TicketOperationResult(ticketId, false, "TICKET_ALREADY_CLOSED"));
                    failureCount++;
                    continue;
                }

                ticket.setStatus("closed");
                ticket.setSubstatus(substatus);
                ticket.setClosedDate(LocalDateTime.now());
                ticket.setLastModified(LocalDateTime.now());
                ticketRepository.save(ticket);

                TicketHistory history = new TicketHistory();
                history.setTicket(ticket);
                history.setActionId(closedActionId);
                history.setEnteredByPersonId(currentUser.getId());
                history.setEnteredDate(LocalDateTime.now());
                history.setActionDate(LocalDateTime.now());
                history.setNotes(notes);
                ticketHistoryRepository.save(history);

                results.add(new TicketOperationResult(ticketId, true, null));
                successCount++;
            } catch (Exception ex) {
                results.add(new TicketOperationResult(ticketId, false, ex.getMessage()));
                failureCount++;
            }
        }

        return new BulkOperationResult(successCount, failureCount, results);
    }

    /**
     * Bulk change status of tickets.
     *
     * Validates status is "open" or "closed" (400 if not).
     * Then processes each ticket individually.
     *
     * @param ticketIds   list of ticket IDs
     * @param status      target status: "open" | "closed"
     * @param currentUser currently authenticated user (for audit trail)
     * @return BulkOperationResult
     */
    public BulkOperationResult bulkChangeStatus(List<Long> ticketIds, String status,
                                                  PersonDetails currentUser) {
        if (!"open".equals(status) && !"closed".equals(status)) {
            throw new BusinessException("INVALID_STATUS",
                "status must be 'open' or 'closed', got: " + status);
        }

        Long updateActionId = findActionId("update");

        List<TicketOperationResult> results = new ArrayList<>();
        int successCount = 0;
        int failureCount = 0;

        for (Long ticketId : ticketIds) {
            try {
                Ticket ticket = ticketRepository.findById(ticketId).orElse(null);
                if (ticket == null) {
                    results.add(new TicketOperationResult(ticketId, false, "TICKET_NOT_FOUND"));
                    failureCount++;
                    continue;
                }

                ticket.setStatus(status);
                ticket.setLastModified(LocalDateTime.now());
                ticketRepository.save(ticket);

                TicketHistory history = new TicketHistory();
                history.setTicket(ticket);
                history.setActionId(updateActionId);
                history.setEnteredByPersonId(currentUser.getId());
                history.setEnteredDate(LocalDateTime.now());
                history.setActionDate(LocalDateTime.now());
                ticketHistoryRepository.save(history);

                results.add(new TicketOperationResult(ticketId, true, null));
                successCount++;
            } catch (Exception ex) {
                results.add(new TicketOperationResult(ticketId, false, ex.getMessage()));
                failureCount++;
            }
        }

        return new BulkOperationResult(successCount, failureCount, results);
    }

    /**
     * Looks up an action ID by name from the actions seed table.
     * Throws IllegalStateException (500) if the action is missing — seed data is required.
     */
    private Long findActionId(String name) {
        return actionsRepository.findByName(name)
            .map(a -> a.getId())
            .orElseThrow(() -> new IllegalStateException(
                "Required action seed data missing: '" + name + "'"));
    }
}
