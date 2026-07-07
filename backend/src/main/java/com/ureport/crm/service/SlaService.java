package com.ureport.crm.service;

import com.ureport.domain.Category;
import com.ureport.domain.Substatus;
import com.ureport.domain.Ticket;
import com.ureport.domain.TicketHistory;
import com.ureport.repository.ActionsRepository;
import com.ureport.repository.SubstatusRepository;
import com.ureport.repository.TicketHistoryRepository;
import com.ureport.repository.TicketRepository;
import com.ureport.security.PersonDetails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;

/**
 * SLA business rule engine — CASE-01.
 *
 * Computes SLA due dates and overdue state, and triggers autoClose when
 * category.auto_close_is_active=true and the ticket is overdue.
 *
 * Integration points:
 * - Called by TicketService.createTicket (after persist)
 * - Called by TicketService.getTicket to compute isOverdue / slaDueDate
 * - Called by a future @Scheduled cron job without modification
 */
@Service
public class SlaService {

    private static final Logger log = LoggerFactory.getLogger(SlaService.class);

    private final TicketRepository ticketRepository;
    private final TicketHistoryRepository ticketHistoryRepository;
    private final SubstatusRepository substatusRepository;
    private final ActionsRepository actionsRepository;

    public SlaService(TicketRepository ticketRepository,
                      TicketHistoryRepository ticketHistoryRepository,
                      SubstatusRepository substatusRepository,
                      ActionsRepository actionsRepository) {
        this.ticketRepository = ticketRepository;
        this.ticketHistoryRepository = ticketHistoryRepository;
        this.substatusRepository = substatusRepository;
        this.actionsRepository = actionsRepository;
    }

    /**
     * Computes the SLA due date for a ticket based on its category.sla_days.
     *
     * @return null if category has no sla_days or sla_days == 0;
     *         otherwise entered_date + sla_days as an Instant
     */
    public Instant computeSlaDueDate(Ticket ticket, Category category) {
        if (category == null) return null;
        Integer slaDays = category.getSlaDays();
        if (slaDays == null || slaDays == 0) return null;
        if (ticket.getEnteredDate() == null) return null;

        return ticket.getEnteredDate()
            .toInstant(ZoneOffset.UTC)
            .plus(slaDays, ChronoUnit.DAYS);
    }

    /**
     * Determines if a ticket is currently overdue.
     *
     * Overdue = NOW() > slaDueDate AND ticket.status != "closed"
     *
     * @return false if ticket is closed, has no SLA, or slaDueDate is in the future
     */
    public boolean isOverdue(Ticket ticket, Category category) {
        if (ticket == null) return false;
        if ("closed".equals(ticket.getStatus())) return false;

        Instant slaDue = computeSlaDueDate(ticket, category);
        if (slaDue == null) return false;

        return Instant.now().isAfter(slaDue);
    }

    /**
     * Triggers auto-close for a ticket when the category policy requires it.
     *
     * Auto-close fires when:
     *   1. category.auto_close_is_active == true
     *   2. ticket is overdue (isOverdue == true)
     *   3. ticket.status != "closed" (not already closed)
     *
     * If category.auto_close_substatus_id is null, logs a WARN and returns
     * without closing (T-04-11: no silent data mutation).
     *
     * @param ticket      ticket to potentially auto-close
     * @param category    category with SLA policy fields
     * @param systemUser  user to record in ticket_history (typically the system user)
     */
    public void triggerAutoClose(Ticket ticket, Category category, PersonDetails systemUser) {
        if (category == null) return;
        if (Boolean.TRUE.equals(category.getAutoCloseIsActive()) == false) return;
        if (!isOverdue(ticket, category)) return;
        if ("closed".equals(ticket.getStatus())) return;

        Long autoCloseSubstatusId = category.getAutoCloseSubstatusId();
        if (autoCloseSubstatusId == null) {
            log.warn("autoClose triggered for ticket {} but category {} has null auto_close_substatus_id — skipping close",
                ticket.getId(), category.getId());
            return;
        }

        Substatus substatus = substatusRepository.findById(autoCloseSubstatusId).orElse(null);
        if (substatus == null) {
            log.warn("autoClose triggered for ticket {} but substatus {} not found — skipping close",
                ticket.getId(), autoCloseSubstatusId);
            return;
        }

        Long closedActionId = actionsRepository.findByName("closed")
            .map(a -> a.getId())
            .orElseThrow(() -> new IllegalStateException("Seed action 'closed' missing"));

        ticket.setStatus("closed");
        ticket.setSubstatus(substatus);
        ticket.setClosedDate(LocalDateTime.now());
        ticket.setLastModified(LocalDateTime.now());
        ticketRepository.save(ticket);

        TicketHistory history = new TicketHistory();
        history.setTicket(ticket);
        history.setActionId(closedActionId);
        history.setEnteredByPersonId(systemUser != null ? systemUser.getId() : null);
        history.setEnteredDate(LocalDateTime.now());
        history.setActionDate(LocalDateTime.now());
        history.setNotes("Auto-closed by SLA policy");
        ticketHistoryRepository.save(history);
    }
}
