package com.ureport.repository;

import com.ureport.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    /**
     * Checks if any ticket has this parentId, used for circular duplicate detection.
     * Wave 2b (TicketSearchService) will add @Query FTS and filter methods.
     */
    boolean existsByParentId(Long parentId);
}
