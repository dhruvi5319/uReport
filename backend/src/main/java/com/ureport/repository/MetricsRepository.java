package com.ureport.repository;

import com.ureport.domain.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Placeholder repository for the metrics package.
 * Actual aggregation queries use JdbcTemplate in MetricsService
 * to avoid Object[] mapping overhead and enable cleaner SQL.
 */
public interface MetricsRepository extends JpaRepository<Ticket, Long> {
}
