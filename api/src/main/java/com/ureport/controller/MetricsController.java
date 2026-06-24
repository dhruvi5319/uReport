package com.ureport.controller;

import com.ureport.service.MetricsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@PreAuthorize("hasRole('STAFF')")
public class MetricsController {

    private final MetricsService metricsService;

    @Autowired
    public MetricsController(MetricsService metricsService) {
        this.metricsService = metricsService;
    }

    /**
     * GET /api/v1/metrics?category_id=&numDays=&effectiveDate=
     */
    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> getMetrics(
            @RequestParam(required = false) Integer category_id,
            @RequestParam(required = false) Integer numDays,
            @RequestParam(required = false) String effectiveDate) {

        LocalDate date = null;
        if (effectiveDate != null && !effectiveDate.isBlank()) {
            date = LocalDate.parse(effectiveDate);
        }

        Map<String, Object> result = metricsService.getOnTimePercentage(category_id, numDays, date);
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/v1/reports/{reportType}?startDate=&endDate=&...
     */
    @GetMapping("/reports/{reportType}")
    public ResponseEntity<Map<String, Object>> getReport(
            @PathVariable String reportType,
            @RequestParam Map<String, String> params) {

        Map<String, Object> result = metricsService.getReport(reportType, params);
        return ResponseEntity.ok(result);
    }
}
