package com.ureport.repository;

import com.ureport.entity.TicketHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketHistoryRepository extends JpaRepository<TicketHistory, Long> {
    List<TicketHistory> findByTicketIdOrderByEnteredDateAsc(Long ticketId);
    Optional<TicketHistory> findByIdAndTicketId(Long id, Long ticketId);

    /**
     * Find ticketHistory rows where sentNotifications IS NULL — used by DigestNotificationScheduler.
     */
    @Query("SELECT h FROM TicketHistory h WHERE h.sentNotifications IS NULL")
    List<TicketHistory> findBySentNotificationsIsNull();
}
