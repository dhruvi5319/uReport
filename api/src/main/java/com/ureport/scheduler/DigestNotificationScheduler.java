package com.ureport.scheduler;

import com.ureport.entity.TicketHistory;
import com.ureport.repository.TicketHistoryRepository;
import com.ureport.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DigestNotificationScheduler {

    private static final Logger log = LoggerFactory.getLogger(DigestNotificationScheduler.class);

    private final TicketHistoryRepository ticketHistoryRepository;
    private final NotificationService notificationService;

    @Autowired
    public DigestNotificationScheduler(TicketHistoryRepository ticketHistoryRepository,
                                        NotificationService notificationService) {
        this.ticketHistoryRepository = ticketHistoryRepository;
        this.notificationService = notificationService;
    }

    /**
     * Every 5 minutes: process ticketHistory rows where sentNotifications IS NULL.
     * After processing, sentNotifications is updated to the addressed emails.
     */
    @Scheduled(fixedDelayString = "${app.scheduler.digest.delay-ms:300000}")
    public void processDigestNotifications() {
        // SELECT ticketHistory WHERE sentNotifications IS NULL
        List<TicketHistory> pending = ticketHistoryRepository.findBySentNotificationsIsNull();

        if (pending.isEmpty()) {
            return;
        }

        int processed = 0;
        for (TicketHistory entry : pending) {
            try {
                notificationService.processPendingNotifications(entry);
                processed++;
            } catch (Exception e) {
                log.warn("[SCHEDULER] DigestNotificationScheduler failed to process history entry {}: {}",
                        entry.getId(), e.getMessage());
            }
        }

        log.info("[SCHEDULER] DigestNotificationScheduler processed {} entries", processed);
    }
}
