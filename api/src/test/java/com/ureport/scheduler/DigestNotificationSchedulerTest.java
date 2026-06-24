package com.ureport.scheduler;

import com.ureport.entity.TicketHistory;
import com.ureport.repository.TicketHistoryRepository;
import com.ureport.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DigestNotificationSchedulerTest {

    @Mock
    private TicketHistoryRepository ticketHistoryRepository;

    @Mock
    private NotificationService notificationService;

    private DigestNotificationScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new DigestNotificationScheduler(ticketHistoryRepository, notificationService);
    }

    @Test
    void testProcessDigestNotifications_sendsEmailsAndUpdatesSentNotifications() {
        // Arrange: two history entries with null sentNotifications
        TicketHistory entry1 = new TicketHistory();
        entry1.setTicketId(1L);
        entry1.setActionId(1);
        // sentNotifications is null by default

        TicketHistory entry2 = new TicketHistory();
        entry2.setTicketId(2L);
        entry2.setActionId(3);

        when(ticketHistoryRepository.findBySentNotificationsIsNull())
                .thenReturn(List.of(entry1, entry2));

        // Act
        scheduler.processDigestNotifications();

        // Assert: processPendingNotifications called for each entry
        verify(notificationService).processPendingNotifications(entry1);
        verify(notificationService).processPendingNotifications(entry2);
    }

    @Test
    void testProcessDigestNotifications_skipsEntriesWithSentNotifications() {
        // Arrange: the repository query only returns entries where sentNotifications IS NULL
        // So entries with sentNotifications set should NOT be returned by the query
        TicketHistory entryWithSent = new TicketHistory();
        entryWithSent.setTicketId(3L);
        entryWithSent.setActionId(1);
        entryWithSent.setSentNotifications("user@example.com"); // already sent

        // The repository should NOT return this entry (it has sentNotifications set)
        when(ticketHistoryRepository.findBySentNotificationsIsNull())
                .thenReturn(List.of()); // empty — nothing with null sentNotifications

        // Act
        scheduler.processDigestNotifications();

        // Assert: processPendingNotifications NOT called for the already-sent entry
        verify(notificationService, never()).processPendingNotifications(entryWithSent);
        verify(notificationService, never()).processPendingNotifications(any());
    }

    @Test
    void testProcessDigestNotifications_handlesNoPendingEntries() {
        // Arrange: no pending entries
        when(ticketHistoryRepository.findBySentNotificationsIsNull())
                .thenReturn(List.of());

        // Act
        scheduler.processDigestNotifications();

        // Assert: no processing occurred
        verify(notificationService, never()).processPendingNotifications(any());
    }

    @Test
    void testProcessDigestNotifications_continuesOnError() {
        // Arrange: one entry that causes an error, another that succeeds
        TicketHistory entry1 = new TicketHistory();
        entry1.setTicketId(1L);
        entry1.setActionId(1);

        TicketHistory entry2 = new TicketHistory();
        entry2.setTicketId(2L);
        entry2.setActionId(1);

        when(ticketHistoryRepository.findBySentNotificationsIsNull())
                .thenReturn(List.of(entry1, entry2));

        // entry1 throws exception
        doThrow(new RuntimeException("Mail server error"))
                .when(notificationService).processPendingNotifications(entry1);

        // Act — should not throw
        scheduler.processDigestNotifications();

        // Assert: both entries were attempted
        verify(notificationService).processPendingNotifications(entry1);
        verify(notificationService).processPendingNotifications(entry2);
    }
}
