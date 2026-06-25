package com.ureport.scheduler;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

@Component
public class AuditScheduler {

    private static final Logger log = LoggerFactory.getLogger(AuditScheduler.class);

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Weekly at Sunday 3 AM: run 5 data integrity checks and log findings.
     */
    @Scheduled(cron = "${app.scheduler.audit.cron:0 0 3 * * SUN}")
    @Transactional(readOnly = true)
    public void auditDataIntegrity() {
        log.info("[SCHEDULER] AuditScheduler starting at {}", OffsetDateTime.now());

        Map<String, Object> findings = new HashMap<>();

        // Check 1: Closed tickets without closedDate
        try {
            long closedWithoutDate = ((Number) entityManager.createNativeQuery(
                    "SELECT COUNT(*) FROM tickets WHERE status = 'closed' AND closedDate IS NULL")
                    .getSingleResult()).longValue();
            findings.put("closedTicketsWithoutClosedDate", closedWithoutDate);
        } catch (Exception e) {
            log.warn("[SCHEDULER] AuditScheduler check 1 failed: {}", e.getMessage());
            findings.put("closedTicketsWithoutClosedDate", "ERROR");
        }

        // Check 2: Tickets where substatus.status != tickets.status
        try {
            long substatusMismatch = ((Number) entityManager.createNativeQuery(
                    "SELECT COUNT(*) FROM tickets t " +
                    "JOIN substatuses s ON t.substatus_id = s.id " +
                    "WHERE s.status != t.status")
                    .getSingleResult()).longValue();
            findings.put("ticketsWithSubstatusMismatch", substatusMismatch);
        } catch (Exception e) {
            log.warn("[SCHEDULER] AuditScheduler check 2 failed: {}", e.getMessage());
            findings.put("ticketsWithSubstatusMismatch", "ERROR");
        }

        // Check 3: Orphaned ticketHistory rows (should be 0 due to CASCADE)
        try {
            long orphanedHistory = ((Number) entityManager.createNativeQuery(
                    "SELECT COUNT(*) FROM ticketHistory th " +
                    "WHERE NOT EXISTS (SELECT 1 FROM tickets t WHERE t.id = th.ticket_id)")
                    .getSingleResult()).longValue();
            findings.put("orphanedTicketHistoryRows", orphanedHistory);
        } catch (Exception e) {
            log.warn("[SCHEDULER] AuditScheduler check 3 failed: {}", e.getMessage());
            findings.put("orphanedTicketHistoryRows", "ERROR");
        }

        // Check 4: Media rows where disk file is missing (counted via DB only — disk check deferred)
        try {
            long mediaCount = ((Number) entityManager.createNativeQuery(
                    "SELECT COUNT(*) FROM media")
                    .getSingleResult()).longValue();
            // Note: actual disk file existence check requires I/O and is logged separately
            findings.put("totalMediaRows", mediaCount);
        } catch (Exception e) {
            log.warn("[SCHEDULER] AuditScheduler check 4 failed: {}", e.getMessage());
            findings.put("totalMediaRows", "ERROR");
        }

        // Check 5: Staff people (role='staff') without username
        try {
            long staffWithoutUsername = ((Number) entityManager.createNativeQuery(
                    "SELECT COUNT(*) FROM people WHERE role = 'staff' AND (username IS NULL OR username = '')")
                    .getSingleResult()).longValue();
            findings.put("staffWithoutUsername", staffWithoutUsername);
        } catch (Exception e) {
            log.warn("[SCHEDULER] AuditScheduler check 5 failed: {}", e.getMessage());
            findings.put("staffWithoutUsername", "ERROR");
        }

        log.info("[SCHEDULER] AuditScheduler completed at {}: findings = {}", OffsetDateTime.now(), findings);
    }
}
