package com.ureport.repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Dashboard statistics queries.
 * All queries accept a nullable deptId parameter:
 * - deptId IS NULL → system-wide (ROLE_ADMIN)
 * - deptId IS NOT NULL → dept-scoped (ROLE_STAFF)
 *
 * T-06-09 mitigated: deptId is read from JWT principal (not from request param)
 * and applied via typed @Param binding — never string-interpolated into SQL.
 */
@Repository
public interface DashboardRepository extends org.springframework.data.jpa.repository.JpaRepository<com.ureport.domain.Ticket, Long> {

    // Total open tickets (dept-scoped when deptId != null)
    @Query(value = """
        SELECT COUNT(*) FROM tickets t
        JOIN categories c ON t.category_id = c.id
        WHERE t.status = 'open'
        AND (:deptId IS NULL OR c.department_id = :deptId)
        """, nativeQuery = true)
    long countTotalOpen(@Param("deptId") Long deptId);

    // Tickets opened today (entered_date = CURRENT_DATE)
    @Query(value = """
        SELECT COUNT(*) FROM tickets t
        JOIN categories c ON t.category_id = c.id
        WHERE t.status = 'open'
        AND DATE(t.entered_date) = CURRENT_DATE
        AND (:deptId IS NULL OR c.department_id = :deptId)
        """, nativeQuery = true)
    long countOpenedToday(@Param("deptId") Long deptId);

    // Tickets closed today (closed_date = CURRENT_DATE)
    @Query(value = """
        SELECT COUNT(*) FROM tickets t
        JOIN categories c ON t.category_id = c.id
        WHERE t.status = 'closed'
        AND DATE(t.closed_date) = CURRENT_DATE
        AND (:deptId IS NULL OR c.department_id = :deptId)
        """, nativeQuery = true)
    long countClosedToday(@Param("deptId") Long deptId);

    // Overdue tickets: open + sla_days set + entered_date + sla_days interval < NOW()
    @Query(value = """
        SELECT COUNT(*) FROM tickets t
        JOIN categories c ON t.category_id = c.id
        WHERE t.status = 'open'
        AND c.sla_days IS NOT NULL
        AND t.entered_date + (c.sla_days || ' days')::interval < NOW()
        AND (:deptId IS NULL OR c.department_id = :deptId)
        """, nativeQuery = true)
    long countOverdue(@Param("deptId") Long deptId);

    // Chart: group by status
    @Query(value = """
        SELECT t.status as label, COUNT(*) as count
        FROM tickets t
        GROUP BY t.status
        ORDER BY count DESC
        """, nativeQuery = true)
    List<Object[]> chartByStatus();

    // Chart: group by category
    @Query(value = """
        SELECT c.name as label, COUNT(*) as count
        FROM tickets t
        JOIN categories c ON t.category_id = c.id
        GROUP BY c.name
        ORDER BY count DESC
        """, nativeQuery = true)
    List<Object[]> chartByCategory();

    // Chart: group by department
    @Query(value = """
        SELECT d.name as label, COUNT(*) as count
        FROM tickets t
        JOIN categories c ON t.category_id = c.id
        JOIN departments d ON c.department_id = d.id
        GROUP BY d.name
        ORDER BY count DESC
        """, nativeQuery = true)
    List<Object[]> chartByDepartment();
}
