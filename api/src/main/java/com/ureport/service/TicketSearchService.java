package com.ureport.service;

import com.ureport.dto.request.TicketSearchParams;
import com.ureport.dto.response.MapViewResponse;
import com.ureport.dto.response.TicketSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Ticket search service using JdbcTemplate for dynamic SQL queries.
 *
 * Key behaviors:
 * - FTS via: WHERE t.search_vector @@ websearch_to_tsquery('english', ?)
 * - Geo filter via: AND ST_DWithin(t.geo_point, ST_MakePoint(?, ?)::geography, ?)
 * - Sort injection prevention via ALLOWED_SORT_COLUMNS whitelist
 * - Paginated search (25 default), unpaginated export, and geo-cluster map view
 */
@Service
public class TicketSearchService {

    private static final Set<String> ALLOWED_SORT_COLUMNS = Set.of(
            "enteredDate", "lastModified", "closedDate", "status", "category_id"
    );

    private static final Map<Integer, String> ZOOM_CLUSTER_COLUMNS = Map.of(
            0, "cluster_id_0",
            1, "cluster_id_1",
            2, "cluster_id_2",
            3, "cluster_id_3",
            4, "cluster_id_4",
            5, "cluster_id_5",
            6, "cluster_id_6"
    );

    private final JdbcTemplate jdbcTemplate;

    public TicketSearchService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Paginated ticket search with FTS, multi-field filters, and sort.
     *
     * @param params search parameters including pagination
     * @return Page of TicketSummaryResponse
     */
    public Page<TicketSummaryResponse> search(TicketSearchParams params) {
        StringBuilder sql = buildBaseSelect();
        List<Object> paramList = new ArrayList<>();
        applyFilters(sql, paramList, params);
        applyOrderBy(sql, paramList, params);

        // Count query for pagination total
        String countSql = "SELECT COUNT(*) FROM (" + sql + ") AS count_query";
        Long total = jdbcTemplate.queryForObject(countSql, Long.class, paramList.toArray());
        if (total == null) total = 0L;

        // Pagination
        int offset = (params.getPage() - 1) * params.getLimit();
        sql.append("LIMIT ? OFFSET ?");
        paramList.add(params.getLimit());
        paramList.add(offset);

        List<TicketSummaryResponse> results = jdbcTemplate.query(
                sql.toString(), ticketRowMapper(), paramList.toArray());

        return new PageImpl<>(results, PageRequest.of(params.getPage() - 1, params.getLimit()), total);
    }

    /**
     * Unpaginated ticket export for CSV/print. Staff permission enforced by controller.
     *
     * @param params search parameters (pagination fields are ignored)
     * @return full list of matching tickets, no page limit
     */
    public List<TicketSummaryResponse> searchForExport(TicketSearchParams params) {
        StringBuilder sql = buildBaseSelect();
        List<Object> paramList = new ArrayList<>();
        applyFilters(sql, paramList, params);
        applyOrderBy(sql, paramList, params);
        // No LIMIT/OFFSET — returns all matching rows

        return jdbcTemplate.query(sql.toString(), ticketRowMapper(), paramList.toArray());
    }

    /**
     * Geo-cluster map view. Returns cluster centroids with ticket counts.
     * Zoom level 0-6 controls cluster_id_{N} column in ticket_geodata table.
     *
     * @param params  search parameters (same filters as search, no pagination)
     * @param zoomLevel 0–6 zoom level for cluster granularity
     * @return MapViewResponse with cluster list
     */
    public MapViewResponse searchForMap(TicketSearchParams params, int zoomLevel) {
        // Clamp zoom level to valid range
        int zoom = Math.min(Math.max(zoomLevel, 0), 6);
        String clusterCol = ZOOM_CLUSTER_COLUMNS.get(zoom);

        StringBuilder sql = new StringBuilder(
                "SELECT g.id AS cluster_id," +
                " COUNT(tgd.ticket_id) AS count," +
                " ST_Y(g.center::geometry) AS lat," +
                " ST_X(g.center::geometry) AS long" +
                " FROM ticket_geodata tgd" +
                " JOIN geoclusters g ON tgd." + clusterCol + " = g.id" +
                " JOIN tickets t ON tgd.ticket_id = t.id" +
                " JOIN categories c ON t.category_id = c.id" +
                " LEFT JOIN substatus s ON t.substatus_id = s.id" +
                " LEFT JOIN people p ON t.assignedPerson_id = p.id" +
                " LEFT JOIN contactMethods cm ON t.contactMethod_id = cm.id" +
                " LEFT JOIN departments d ON c.department_id = d.id" +
                " WHERE 1=1 ");

        List<Object> paramList = new ArrayList<>();
        applyFilters(sql, paramList, params);

        sql.append("GROUP BY g.id, g.center ORDER BY count DESC");

        List<MapViewResponse.MapCluster> clusters = jdbcTemplate.query(
                sql.toString(),
                (rs, rowNum) -> {
                    MapViewResponse.MapCluster cluster = new MapViewResponse.MapCluster();
                    cluster.setClusterId(rs.getLong("cluster_id"));
                    cluster.setCount(rs.getLong("count"));
                    cluster.setLat(rs.getDouble("lat"));
                    cluster.setLon(rs.getDouble("long"));
                    return cluster;
                },
                paramList.toArray()
        );

        MapViewResponse response = new MapViewResponse();
        response.setClusters(clusters);
        return response;
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private StringBuilder buildBaseSelect() {
        return new StringBuilder("""
                SELECT t.id,
                       t.status,
                       s.name AS substatus_name,
                       t.category_id,
                       c.name AS category_name,
                       t.description,
                       t.location,
                       t.city,
                       t.state,
                       t.zip,
                       t.latitude,
                       t.longitude,
                       t.enteredDate,
                       t.lastModified,
                       t.closedDate,
                       t.assignedPerson_id,
                       p.firstname || ' ' || p.lastname AS assigned_person_name,
                       cm.name AS contact_method_name,
                       (SELECT COUNT(*) FROM media m WHERE m.ticket_id = t.id) AS media_count
                FROM tickets t
                JOIN categories c ON t.category_id = c.id
                LEFT JOIN substatus s ON t.substatus_id = s.id
                LEFT JOIN people p ON t.assignedPerson_id = p.id
                LEFT JOIN contactMethods cm ON t.contactMethod_id = cm.id
                LEFT JOIN departments d ON c.department_id = d.id
                WHERE 1=1
                """);
    }

    private void applyFilters(StringBuilder sql, List<Object> paramList, TicketSearchParams params) {
        // FTS keyword search
        if (params.getQ() != null && !params.getQ().isBlank()) {
            sql.append("AND t.search_vector @@ websearch_to_tsquery('english', ?) ");
            paramList.add(params.getQ());
        }
        // Status filter
        if (params.getStatus() != null) {
            sql.append("AND t.status = ? ");
            paramList.add(params.getStatus());
        }
        // Category filter
        if (params.getCategoryId() != null) {
            sql.append("AND t.category_id = ? ");
            paramList.add(params.getCategoryId());
        }
        // Department filter (via category join)
        if (params.getDepartmentId() != null) {
            sql.append("AND c.department_id = ? ");
            paramList.add(params.getDepartmentId());
        }
        // Assigned person
        if (params.getAssignedPersonId() != null) {
            sql.append("AND t.assignedPerson_id = ? ");
            paramList.add(params.getAssignedPersonId());
        }
        // Entered-by person
        if (params.getEnteredByPersonId() != null) {
            sql.append("AND t.enteredByPerson_id = ? ");
            paramList.add(params.getEnteredByPersonId());
        }
        // Reported-by person
        if (params.getReportedByPersonId() != null) {
            sql.append("AND t.reportedByPerson_id = ? ");
            paramList.add(params.getReportedByPersonId());
        }
        // Substatus
        if (params.getSubstatusId() != null) {
            sql.append("AND t.substatus_id = ? ");
            paramList.add(params.getSubstatusId());
        }
        // Contact method
        if (params.getContactMethodId() != null) {
            sql.append("AND t.contactMethod_id = ? ");
            paramList.add(params.getContactMethodId());
        }
        // Client
        if (params.getClientId() != null) {
            sql.append("AND t.client_id = ? ");
            paramList.add(params.getClientId());
        }
        // Issue type
        if (params.getIssueTypeId() != null) {
            sql.append("AND t.issueType_id = ? ");
            paramList.add(params.getIssueTypeId());
        }
        // Date ranges
        if (params.getEnteredDateFrom() != null) {
            sql.append("AND t.enteredDate >= ?::timestamptz ");
            paramList.add(params.getEnteredDateFrom());
        }
        if (params.getEnteredDateTo() != null) {
            sql.append("AND t.enteredDate <= ?::timestamptz ");
            paramList.add(params.getEnteredDateTo());
        }
        if (params.getClosedDateFrom() != null) {
            sql.append("AND t.closedDate >= ?::timestamptz ");
            paramList.add(params.getClosedDateFrom());
        }
        if (params.getClosedDateTo() != null) {
            sql.append("AND t.closedDate <= ?::timestamptz ");
            paramList.add(params.getClosedDateTo());
        }
        // Location string filters
        if (params.getCity() != null) {
            sql.append("AND LOWER(t.city) = LOWER(?) ");
            paramList.add(params.getCity());
        }
        if (params.getZip() != null) {
            sql.append("AND t.zip = ? ");
            paramList.add(params.getZip());
        }
        // Geo radius filter (ST_DWithin) — requires geo_point column populated by DB trigger
        if (params.getLat() != null && params.getLon() != null && params.getRadius() != null) {
            sql.append("AND ST_DWithin(t.geo_point, ST_MakePoint(?, ?)::geography, ?) ");
            paramList.add(params.getLon());  // ST_MakePoint(longitude, latitude)
            paramList.add(params.getLat());
            paramList.add(params.getRadius());
        }
    }

    private void applyOrderBy(StringBuilder sql, List<Object> paramList, TicketSearchParams params) {
        // FTS rank takes precedence when keyword search is active
        if (params.getQ() != null && !params.getQ().isBlank()) {
            sql.append("ORDER BY ts_rank(t.search_vector, websearch_to_tsquery('english', ?)) DESC ");
            paramList.add(params.getQ());
        } else {
            // Whitelist prevents SQL injection via sort param
            String sortCol = ALLOWED_SORT_COLUMNS.contains(params.getSortBy())
                    ? params.getSortBy() : "enteredDate";
            String sortDir = "asc".equalsIgnoreCase(params.getSortDir()) ? "ASC" : "DESC";
            sql.append("ORDER BY t.").append(sortCol).append(" ").append(sortDir).append(" ");
        }
    }

    private RowMapper<TicketSummaryResponse> ticketRowMapper() {
        return (rs, rowNum) -> {
            TicketSummaryResponse t = new TicketSummaryResponse();
            t.setId(rs.getLong("id"));
            t.setStatus(rs.getString("status"));
            t.setSubstatusName(rs.getString("substatus_name"));
            t.setCategoryId(rs.getInt("category_id"));
            t.setCategoryName(rs.getString("category_name"));
            t.setDescription(rs.getString("description"));
            t.setLocation(rs.getString("location"));
            t.setCity(rs.getString("city"));
            t.setState(rs.getString("state"));
            t.setZip(rs.getString("zip"));

            var lat = rs.getBigDecimal("latitude");
            var lon = rs.getBigDecimal("longitude");
            t.setLatitude(lat);
            t.setLongitude(lon);

            t.setEnteredDate(formatTimestamp(rs, "enteredDate"));
            t.setLastModified(formatTimestamp(rs, "lastModified"));
            t.setClosedDate(formatTimestamp(rs, "closedDate"));

            int assignedPersonId = rs.getInt("assignedPerson_id");
            t.setAssignedPersonId(rs.wasNull() ? null : assignedPersonId);
            t.setAssignedPersonName(rs.getString("assigned_person_name"));
            t.setContactMethodName(rs.getString("contact_method_name"));

            int mediaCount = rs.getInt("media_count");
            t.setMediaCount(rs.wasNull() ? 0 : mediaCount);

            return t;
        };
    }

    private String formatTimestamp(ResultSet rs, String column) throws SQLException {
        Timestamp ts = rs.getTimestamp(column);
        if (ts == null) return null;
        return ts.toInstant()
                .atOffset(java.time.ZoneOffset.UTC)
                .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
    }
}
