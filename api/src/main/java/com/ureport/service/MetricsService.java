package com.ureport.service;

import com.ureport.exception.ValidationException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class MetricsService {

    private static final Set<String> VALID_REPORT_TYPES = Set.of(
            "activity", "assignments", "categories", "staff", "person",
            "sla", "volume", "current", "opened", "closed");

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Calculate on-time percentage for tickets closed in the given window.
     * onTime = closedDate <= enteredDate + slaDays days
     */
    public Map<String, Object> getOnTimePercentage(Integer categoryId, Integer numDays,
                                                     LocalDate effectiveDate) {
        if (effectiveDate == null) {
            effectiveDate = LocalDate.now();
        }
        if (numDays == null) {
            numDays = 30;
        }

        LocalDate startDate = effectiveDate.minusDays(numDays);

        // Get category name
        String categoryName = "";
        try {
            Object[] catRow = (Object[]) entityManager.createNativeQuery(
                    "SELECT name, slaDays FROM categories WHERE id = :id")
                    .setParameter("id", categoryId)
                    .getSingleResult();
            categoryName = (String) catRow[0];
            Integer slaDays = catRow[1] != null ? ((Number) catRow[1]).intValue() : null;

            // Count closed tickets in window
            long closedCount = ((Number) entityManager.createNativeQuery(
                    "SELECT COUNT(*) FROM tickets " +
                    "WHERE category_id = :catId AND status = 'closed' " +
                    "  AND closedDate >= :startDate::timestamptz " +
                    "  AND closedDate <= :endDate::timestamptz")
                    .setParameter("catId", categoryId)
                    .setParameter("startDate", startDate.toString())
                    .setParameter("endDate", effectiveDate.toString())
                    .getSingleResult()).longValue();

            long onTimeCount = 0;
            if (slaDays != null && closedCount > 0) {
                onTimeCount = ((Number) entityManager.createNativeQuery(
                        "SELECT COUNT(*) FROM tickets " +
                        "WHERE category_id = :catId AND status = 'closed' " +
                        "  AND closedDate >= :startDate::timestamptz " +
                        "  AND closedDate <= :endDate::timestamptz " +
                        "  AND closedDate <= enteredDate + (:slaDays || ' days')::INTERVAL")
                        .setParameter("catId", categoryId)
                        .setParameter("startDate", startDate.toString())
                        .setParameter("endDate", effectiveDate.toString())
                        .setParameter("slaDays", slaDays)
                        .getSingleResult()).longValue();
            }

            double onTimePercentage = closedCount > 0
                    ? (double) onTimeCount / closedCount * 100.0
                    : 0.0;

            Map<String, Object> result = new HashMap<>();
            result.put("category_id", categoryId);
            result.put("categoryName", categoryName);
            result.put("numDays", numDays);
            result.put("effectiveDate", effectiveDate.toString());
            result.put("onTimePercentage", Math.round(onTimePercentage * 100.0) / 100.0);
            result.put("closedCount", closedCount);
            result.put("onTimeCount", onTimeCount);
            return result;
        } catch (Exception e) {
            if (e instanceof ValidationException) throw e;
            Map<String, Object> result = new HashMap<>();
            result.put("category_id", categoryId);
            result.put("categoryName", categoryName);
            result.put("numDays", numDays);
            result.put("effectiveDate", effectiveDate.toString());
            result.put("onTimePercentage", 0.0);
            result.put("closedCount", 0);
            result.put("onTimeCount", 0);
            return result;
        }
    }

    /**
     * Get one of 10 canned reports by reportType.
     * Returns { reportType, generatedAt, data: [...] }
     */
    public Map<String, Object> getReport(String reportType, Map<String, String> params) {
        if (!VALID_REPORT_TYPES.contains(reportType)) {
            throw new ValidationException("INVALID_REPORT_TYPE",
                    "Invalid report type: " + reportType + ". Valid types: " + VALID_REPORT_TYPES);
        }

        List<?> data = switch (reportType) {
            case "activity" -> getActivityReport(params);
            case "assignments" -> getAssignmentsReport(params);
            case "categories" -> getCategoriesReport(params);
            case "staff" -> getStaffReport(params);
            case "person" -> getPersonReport(params);
            case "sla" -> getSlaReport(params);
            case "volume" -> getVolumeReport(params);
            case "current" -> getCurrentReport(params);
            case "opened" -> getOpenedReport(params);
            case "closed" -> getClosedReport(params);
            default -> List.of();
        };

        Map<String, Object> result = new HashMap<>();
        result.put("reportType", reportType);
        result.put("generatedAt", OffsetDateTime.now().toString());
        result.put("data", data);
        return result;
    }

    // ---- Report implementations ----

    private List<Map<String, Object>> getActivityReport(Map<String, String> params) {
        String startDate = params.getOrDefault("startDate", LocalDate.now().minusDays(30).toString());
        String endDate = params.getOrDefault("endDate", LocalDate.now().toString());

        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery(
                "SELECT " +
                "  DATE(enteredDate) as day, " +
                "  COUNT(*) FILTER (WHERE status != 'closed') as opened, " +
                "  COUNT(*) FILTER (WHERE status = 'closed' AND DATE(closedDate) = DATE(enteredDate)) as closed " +
                "FROM tickets " +
                "WHERE enteredDate >= :start::timestamptz AND enteredDate <= :end::timestamptz " +
                "GROUP BY DATE(enteredDate) ORDER BY day")
                .setParameter("start", startDate)
                .setParameter("end", endDate)
                .getResultList();

        return toMapList(rows, "day", "opened", "closed");
    }

    private List<Map<String, Object>> getAssignmentsReport(Map<String, String> params) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery(
                "SELECT t.assignedPerson_id, p.firstName, p.lastName, COUNT(t.id) as ticketCount " +
                "FROM tickets t LEFT JOIN people p ON t.assignedPerson_id = p.id " +
                "WHERE t.assignedPerson_id IS NOT NULL " +
                "GROUP BY t.assignedPerson_id, p.firstName, p.lastName " +
                "ORDER BY ticketCount DESC")
                .getResultList();

        return toMapList(rows, "assignedPerson_id", "firstName", "lastName", "ticketCount");
    }

    private List<Map<String, Object>> getCategoriesReport(Map<String, String> params) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery(
                "SELECT t.category_id, c.name, COUNT(t.id) as ticketCount " +
                "FROM tickets t JOIN categories c ON t.category_id = c.id " +
                "GROUP BY t.category_id, c.name ORDER BY ticketCount DESC")
                .getResultList();

        return toMapList(rows, "category_id", "categoryName", "ticketCount");
    }

    private List<Map<String, Object>> getStaffReport(Map<String, String> params) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery(
                "SELECT p.id, p.firstName, p.lastName, " +
                "  COUNT(DISTINCT t1.id) as ticketsEntered, " +
                "  COUNT(DISTINCT t2.id) as ticketsAssigned " +
                "FROM people p " +
                "LEFT JOIN tickets t1 ON t1.enteredByPerson_id = p.id " +
                "LEFT JOIN tickets t2 ON t2.assignedPerson_id = p.id " +
                "WHERE p.role = 'staff' " +
                "GROUP BY p.id, p.firstName, p.lastName ORDER BY p.lastName")
                .getResultList();

        return toMapList(rows, "person_id", "firstName", "lastName", "ticketsEntered", "ticketsAssigned");
    }

    private List<Map<String, Object>> getPersonReport(Map<String, String> params) {
        String personIdStr = params.get("person_id");
        if (personIdStr == null) return List.of();
        int personId = Integer.parseInt(personIdStr);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery(
                "SELECT t.id, t.category_id, c.name, t.status, t.enteredDate, t.closedDate " +
                "FROM tickets t JOIN categories c ON t.category_id = c.id " +
                "WHERE t.reportedByPerson_id = :pid OR t.assignedPerson_id = :pid " +
                "ORDER BY t.enteredDate DESC")
                .setParameter("pid", personId)
                .getResultList();

        return toMapList(rows, "ticket_id", "category_id", "categoryName", "status", "enteredDate", "closedDate");
    }

    private List<Map<String, Object>> getSlaReport(Map<String, String> params) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery(
                "SELECT t.id, t.category_id, c.name, c.slaDays, " +
                "  CASE WHEN c.slaDays IS NULL THEN 'no_sla' " +
                "       WHEN t.status != 'closed' THEN 'open' " +
                "       WHEN t.closedDate <= t.enteredDate + (c.slaDays || ' days')::INTERVAL THEN 'on_time' " +
                "       ELSE 'late' END as slaStatus " +
                "FROM tickets t JOIN categories c ON t.category_id = c.id " +
                "ORDER BY t.enteredDate DESC LIMIT 1000")
                .getResultList();

        return toMapList(rows, "ticket_id", "category_id", "categoryName", "slaDays", "slaStatus");
    }

    private List<Map<String, Object>> getVolumeReport(Map<String, String> params) {
        String startDate = params.getOrDefault("startDate", LocalDate.now().minusDays(90).toString());
        String endDate = params.getOrDefault("endDate", LocalDate.now().toString());
        String groupBy = params.getOrDefault("groupBy", "week");

        String truncPeriod = "week".equals(groupBy) ? "week" : "month";

        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery(
                "SELECT DATE_TRUNC(:period, enteredDate) as period, COUNT(*) as ticketCount " +
                "FROM tickets " +
                "WHERE enteredDate >= :start::timestamptz AND enteredDate <= :end::timestamptz " +
                "GROUP BY DATE_TRUNC(:period, enteredDate) ORDER BY period")
                .setParameter("period", truncPeriod)
                .setParameter("start", startDate)
                .setParameter("end", endDate)
                .getResultList();

        return toMapList(rows, "period", "ticketCount");
    }

    private List<Map<String, Object>> getCurrentReport(Map<String, String> params) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery(
                "SELECT t.category_id, c.name, COUNT(t.id) as openCount, MIN(t.enteredDate) as oldestDate " +
                "FROM tickets t JOIN categories c ON t.category_id = c.id " +
                "WHERE t.status = 'open' " +
                "GROUP BY t.category_id, c.name ORDER BY openCount DESC")
                .getResultList();

        return toMapList(rows, "category_id", "categoryName", "openCount", "oldestDate");
    }

    private List<Map<String, Object>> getOpenedReport(Map<String, String> params) {
        String date = params.getOrDefault("date", LocalDate.now().toString());

        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery(
                "SELECT t.id, t.category_id, c.name, t.status, t.enteredDate " +
                "FROM tickets t JOIN categories c ON t.category_id = c.id " +
                "WHERE DATE(t.enteredDate) = :date::date " +
                "ORDER BY t.enteredDate DESC")
                .setParameter("date", date)
                .getResultList();

        return toMapList(rows, "ticket_id", "category_id", "categoryName", "status", "enteredDate");
    }

    private List<Map<String, Object>> getClosedReport(Map<String, String> params) {
        String date = params.getOrDefault("date", LocalDate.now().toString());

        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery(
                "SELECT t.id, t.category_id, c.name, t.closedDate " +
                "FROM tickets t JOIN categories c ON t.category_id = c.id " +
                "WHERE t.status = 'closed' AND DATE(t.closedDate) = :date::date " +
                "ORDER BY t.closedDate DESC")
                .setParameter("date", date)
                .getResultList();

        return toMapList(rows, "ticket_id", "category_id", "categoryName", "closedDate");
    }

    // ---- Helper ----

    private List<Map<String, Object>> toMapList(List<Object[]> rows, String... keys) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> map = new HashMap<>();
            for (int i = 0; i < keys.length && i < row.length; i++) {
                map.put(keys[i], row[i]);
            }
            result.add(map);
        }
        return result;
    }
}
