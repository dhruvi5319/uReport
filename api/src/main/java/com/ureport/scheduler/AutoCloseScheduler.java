package com.ureport.scheduler;

import com.ureport.entity.Ticket;
import com.ureport.repository.TicketHistoryRepository;
import com.ureport.service.TicketHistoryService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Component
public class AutoCloseScheduler {

    private static final Logger log = LoggerFactory.getLogger(AutoCloseScheduler.class);

    private final TicketHistoryService ticketHistoryService;

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    public AutoCloseScheduler(TicketHistoryService ticketHistoryService) {
        this.ticketHistoryService = ticketHistoryService;
    }

    /**
     * Nightly at 1 AM: close stale open tickets per category autoCloseIsActive + slaDays rules.
     */
    @Scheduled(cron = "${app.scheduler.auto-close.cron:0 0 1 * * ?}")
    @Transactional
    public void autoCloseStaleTickets() {
        log.info("[SCHEDULER] AutoCloseScheduler starting at {}", OffsetDateTime.now());

        // Query open tickets in categories with autoCloseIsActive=true and slaDays set
        @SuppressWarnings("unchecked")
        List<Object[]> staleTickets = entityManager.createNativeQuery(
                "SELECT t.id, t.category_id, c.slaDays, c.autoCloseSubstatus_id " +
                "FROM tickets t " +
                "JOIN categories c ON t.category_id = c.id " +
                "WHERE t.status = 'open' " +
                "  AND c.autoCloseIsActive = true " +
                "  AND c.slaDays IS NOT NULL " +
                "  AND t.lastModified < NOW() - (c.slaDays || ' days')::INTERVAL")
                .getResultList();

        int closedCount = 0;
        for (Object[] row : staleTickets) {
            Long ticketId = ((Number) row[0]).longValue();
            Integer substatusId = row[3] != null ? ((Number) row[3]).intValue() : null;

            try {
                // Close the ticket
                entityManager.createNativeQuery(
                        "UPDATE tickets SET status = 'closed', closedDate = NOW()" +
                        (substatusId != null ? ", substatus_id = :substatusId" : "") +
                        " WHERE id = :id")
                        .setParameter("id", ticketId)
                        .setParameter("substatusId", substatusId)
                        .executeUpdate();

                // Append closed history entry (action_id=3)
                ticketHistoryService.append(ticketId, 3, null, null,
                        "Auto-closed by scheduler", null);

                closedCount++;
            } catch (Exception e) {
                log.warn("[SCHEDULER] AutoCloseScheduler failed to close ticket {}: {}", ticketId, e.getMessage());
            }
        }

        log.info("[SCHEDULER] AutoCloseScheduler closed {} tickets", closedCount);
    }
}
