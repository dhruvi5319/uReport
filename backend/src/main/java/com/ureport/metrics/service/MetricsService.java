package com.ureport.metrics.service;

import com.ureport.metrics.dto.MetricsDto;
import com.ureport.metrics.dto.ReportGroupDto;
import com.ureport.metrics.dto.VolumeByDayDto;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;

/**
 * Metrics and reporting service.
 *
 * Security mitigations:
 * T-06-07: groupBy validated against VALID_GROUP_BY whitelist; buildReportSql uses switch
 *          returning hardcoded SQL strings — groupBy NEVER concatenated into SQL.
 * T-06-08: start/end are typed LocalDate objects (parsed by Spring from ISO format);
 *          passed as typed parameters via JdbcTemplate positional binding.
 * T-06-10: sanitizeCsvCell strips leading =, +, -, @, \t, \r (OWASP CSV injection defense).
 * T-06-11: validateDateRange rejects ranges > 12 months → bounds volumeByDay to ~366 rows.
 */
@Service
public class MetricsService {

    private static final Set<String> VALID_GROUP_BY = Set.of("category", "department", "assignee");

    private final JdbcTemplate jdbcTemplate;

    public MetricsService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Validate date range: both required, end >= start, range <= 12 months.
     * T-06-11: bounds volumeByDay rows to ~366.
     */
    private void validateDateRange(LocalDate start, LocalDate end) {
        if (start == null || end == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "start and end are required");
        }
        if (end.isBefore(start)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "end must be >= start");
        }
        if (ChronoUnit.MONTHS.between(start, end) > 12) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Date range exceeds 12-month maximum");
        }
    }

    public MetricsDto getMetrics(LocalDate start, LocalDate end) {
        validateDateRange(start, end);

        // volumeByDay: ticket count per day in date range
        List<VolumeByDayDto> volumeByDay = jdbcTemplate.query(
            "SELECT DATE(entered_date) as date, COUNT(*) as count " +
            "FROM tickets WHERE entered_date >= ? AND entered_date <= ? + INTERVAL '1 day' " +
            "GROUP BY DATE(entered_date) ORDER BY date",
            (rs, rowNum) -> new VolumeByDayDto(
                rs.getObject("date", LocalDate.class),
                rs.getLong("count")),
            start, end);

        // avgResolutionHours: average hours from entered_date to closed_date for closed tickets
        Double avgResolution = jdbcTemplate.queryForObject(
            "SELECT AVG(EXTRACT(EPOCH FROM (closed_date - entered_date))/3600) " +
            "FROM tickets WHERE status='closed' AND entered_date >= ? AND entered_date <= ? + INTERVAL '1 day'",
            Double.class, start, end);

        // overdueCount: open tickets past their SLA deadline
        Long overdueCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM tickets t " +
            "JOIN categories c ON t.category_id = c.id " +
            "WHERE t.status='open' AND c.sla_days IS NOT NULL " +
            "  AND t.entered_date + (c.sla_days || ' days')::interval < NOW()",
            Long.class);

        return new MetricsDto(volumeByDay, avgResolution, overdueCount != null ? overdueCount : 0L);
    }

    public List<ReportGroupDto> getReports(String groupBy, LocalDate start, LocalDate end) {
        validateDateRange(start, end);
        if (!VALID_GROUP_BY.contains(groupBy)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "groupBy must be category, department, or assignee");
        }

        // T-06-07: buildReportSql uses switch over whitelisted values — groupBy never interpolated
        String sql = buildReportSql(groupBy);
        return jdbcTemplate.query(sql,
            (rs, rowNum) -> {
                ReportGroupDto dto = new ReportGroupDto();
                dto.setGroupName(rs.getString("group_name"));
                dto.setGroupId(rs.getLong("group_id"));
                dto.setOpenCount(rs.getLong("open_count"));
                dto.setClosedCount(rs.getLong("closed_count"));
                dto.setAvgResolutionHours(rs.getObject("avg_hours", Double.class));
                return dto;
            }, start, end);
    }

    /**
     * Returns a hardcoded SQL string for the whitelisted groupBy value.
     * NEVER interpolates groupBy into the SQL string.
     */
    private String buildReportSql(String groupBy) {
        return switch (groupBy) {
            case "category" -> """
                SELECT c.name as group_name, c.id as group_id,
                       SUM(CASE WHEN t.status='open' THEN 1 ELSE 0 END) as open_count,
                       SUM(CASE WHEN t.status='closed' THEN 1 ELSE 0 END) as closed_count,
                       AVG(CASE WHEN t.status='closed'
                           THEN EXTRACT(EPOCH FROM (t.closed_date - t.entered_date))/3600 END) as avg_hours
                FROM tickets t JOIN categories c ON t.category_id = c.id
                WHERE t.entered_date >= ? AND t.entered_date <= ? + INTERVAL '1 day'
                GROUP BY c.id, c.name ORDER BY open_count DESC
                """;
            case "department" -> """
                SELECT d.name as group_name, d.id as group_id,
                       SUM(CASE WHEN t.status='open' THEN 1 ELSE 0 END) as open_count,
                       SUM(CASE WHEN t.status='closed' THEN 1 ELSE 0 END) as closed_count,
                       AVG(CASE WHEN t.status='closed'
                           THEN EXTRACT(EPOCH FROM (t.closed_date - t.entered_date))/3600 END) as avg_hours
                FROM tickets t
                JOIN categories c ON t.category_id = c.id
                JOIN departments d ON c.department_id = d.id
                WHERE t.entered_date >= ? AND t.entered_date <= ? + INTERVAL '1 day'
                GROUP BY d.id, d.name ORDER BY open_count DESC
                """;
            case "assignee" -> """
                SELECT CONCAT(p.firstname, ' ', p.lastname) as group_name, p.id as group_id,
                       SUM(CASE WHEN t.status='open' THEN 1 ELSE 0 END) as open_count,
                       SUM(CASE WHEN t.status='closed' THEN 1 ELSE 0 END) as closed_count,
                       AVG(CASE WHEN t.status='closed'
                           THEN EXTRACT(EPOCH FROM (t.closed_date - t.entered_date))/3600 END) as avg_hours
                FROM tickets t
                JOIN people p ON t.assigned_person_id = p.id
                WHERE t.entered_date >= ? AND t.entered_date <= ? + INTERVAL '1 day'
                GROUP BY p.id, p.firstname, p.lastname ORDER BY open_count DESC
                """;
            default -> throw new IllegalStateException("unreachable after whitelist check");
        };
    }

    public String getReportsCsv(String groupBy, LocalDate start, LocalDate end) {
        List<ReportGroupDto> rows = getReports(groupBy, start, end);

        StringBuilder csv = new StringBuilder();
        csv.append("Group,Open,Closed,Avg Resolution Hours\n");
        for (ReportGroupDto row : rows) {
            // T-06-10: CSV injection guard — sanitize group_name
            String safeName = sanitizeCsvCell(row.getGroupName());
            csv.append(String.format("\"%s\",%d,%d,%s\n",
                safeName,
                row.getOpenCount(),
                row.getClosedCount(),
                row.getAvgResolutionHours() != null
                    ? String.format("%.2f", row.getAvgResolutionHours()) : ""));
        }
        return csv.toString();
    }

    /**
     * Strip leading formula injection characters (OWASP CSV injection defense).
     * Prefixes leading =, +, -, @, \t, \r with a single quote to neutralize.
     */
    private String sanitizeCsvCell(String value) {
        if (value == null) return "";
        // Strip leading formula injection characters (OWASP CSV injection defense)
        String trimmed = value.trim();
        if (!trimmed.isEmpty() && "=+-@\t\r".indexOf(trimmed.charAt(0)) >= 0) {
            trimmed = "'" + trimmed; // prefix with single quote to neutralize
        }
        return trimmed.replace("\"", "\"\""); // escape double quotes
    }
}
