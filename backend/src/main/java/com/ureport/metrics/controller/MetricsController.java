package com.ureport.metrics.controller;

import com.ureport.metrics.dto.MetricsDto;
import com.ureport.metrics.dto.ReportGroupDto;
import com.ureport.metrics.service.MetricsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
public class MetricsController {

    private final MetricsService metricsService;

    public MetricsController(MetricsService metricsService) {
        this.metricsService = metricsService;
    }

    @GetMapping("/metrics")
    public MetricsDto getMetrics(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return metricsService.getMetrics(start, end);
    }

    @GetMapping("/reports")
    public List<ReportGroupDto> getReports(
        @RequestParam String groupBy,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return metricsService.getReports(groupBy, start, end);
    }

    @GetMapping("/reports/export")
    public ResponseEntity<String> exportReports(
        @RequestParam String groupBy,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        String csv = metricsService.getReportsCsv(groupBy, start, end);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"report-" + groupBy + ".csv\"")
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(csv);
    }
}
