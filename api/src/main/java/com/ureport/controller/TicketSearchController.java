package com.ureport.controller;

import com.ureport.dto.request.TicketSearchParams;
import com.ureport.dto.response.MapViewResponse;
import com.ureport.dto.response.TicketSummaryResponse;
import com.ureport.service.TicketSearchService;
import com.ureport.util.CsvExportUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Ticket search and export endpoints.
 *
 * GET /api/v1/tickets         — paginated FTS + multi-field filter search
 * GET /api/v1/tickets/export  — staff-only CSV or print export (StreamingResponseBody)
 * GET /api/v1/tickets/map     — geo-cluster map view at requested zoom level
 */
@RestController
public class TicketSearchController {

    private final TicketSearchService ticketSearchService;
    private final CsvExportUtil csvExportUtil;

    public TicketSearchController(TicketSearchService ticketSearchService,
                                  CsvExportUtil csvExportUtil) {
        this.ticketSearchService = ticketSearchService;
        this.csvExportUtil = csvExportUtil;
    }

    /**
     * GET /api/v1/tickets — paginated ticket search.
     * Auth: any authenticated user (per-category displayPermissionLevel enforced by service).
     * Supports all TicketSearchParams fields via @ModelAttribute binding.
     */
    @GetMapping("/api/v1/tickets")
    public ResponseEntity<?> search(@ModelAttribute TicketSearchParams params) {
        // Validate format if specified (rejects unsupported formats early)
        Page<TicketSummaryResponse> page = ticketSearchService.search(params);
        return ResponseEntity.ok(page);
    }

    /**
     * GET /api/v1/tickets/export — CSV or print-view export (staff only).
     * Streams via StreamingResponseBody to avoid OOM on large datasets.
     * ?format=csv  → text/csv attachment
     * ?format=json or none → JSON list (for print view)
     */
    @GetMapping("/api/v1/tickets/export")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<?> export(@ModelAttribute TicketSearchParams params,
                                    HttpServletRequest request) {
        String format = (String) request.getAttribute("responseFormat");

        // Validate format param
        if (format != null && !format.isEmpty()
                && !format.equals("csv") && !format.equals("json") && !format.equals("print")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "INVALID_FORMAT",
                            "message", "Format must be json, csv, or print"));
        }

        List<TicketSummaryResponse> results = ticketSearchService.searchForExport(params);

        if ("csv".equals(format)) {
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=tickets.csv")
                    .header("Content-Type", "text/csv; charset=utf-8")
                    .body(csvExportUtil.streamTicketsCsv(results));
        }

        // Default: JSON list (used for print view rendering)
        return ResponseEntity.ok(results);
    }

    /**
     * GET /api/v1/tickets/map — geo-cluster map view.
     * Returns cluster centroids with ticket counts at the requested zoom level (0-6).
     * Auth: any authenticated user.
     */
    @GetMapping("/api/v1/tickets/map")
    public ResponseEntity<MapViewResponse> mapView(
            @ModelAttribute TicketSearchParams params,
            @RequestParam(defaultValue = "3") int zoom) {
        return ResponseEntity.ok(ticketSearchService.searchForMap(params, zoom));
    }
}
