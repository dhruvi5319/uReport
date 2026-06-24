package com.ureport.controller;

import com.ureport.scheduler.AuditScheduler;
import com.ureport.scheduler.AutoCloseScheduler;
import com.ureport.scheduler.DigestNotificationScheduler;
import com.ureport.scheduler.GeoClusterScheduler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Manual trigger endpoints for scheduled jobs.
 * All endpoints are staff-only.
 */
@RestController
@RequestMapping("/api/v1/admin/jobs")
@PreAuthorize("hasRole('STAFF')")
public class AdminJobController {

    private final DigestNotificationScheduler digestNotificationScheduler;
    private final AutoCloseScheduler autoCloseScheduler;
    private final AuditScheduler auditScheduler;
    private final GeoClusterScheduler geoClusterScheduler;

    @Autowired
    public AdminJobController(DigestNotificationScheduler digestNotificationScheduler,
                               AutoCloseScheduler autoCloseScheduler,
                               AuditScheduler auditScheduler,
                               GeoClusterScheduler geoClusterScheduler) {
        this.digestNotificationScheduler = digestNotificationScheduler;
        this.autoCloseScheduler = autoCloseScheduler;
        this.auditScheduler = auditScheduler;
        this.geoClusterScheduler = geoClusterScheduler;
    }

    /**
     * POST /api/v1/admin/jobs/digest-notifications/run
     */
    @PostMapping("/digest-notifications/run")
    public ResponseEntity<Map<String, String>> triggerDigestNotifications() {
        digestNotificationScheduler.processDigestNotifications();
        return ResponseEntity.ok(Map.of("status", "triggered"));
    }

    /**
     * POST /api/v1/admin/jobs/auto-close/run
     */
    @PostMapping("/auto-close/run")
    public ResponseEntity<Map<String, String>> triggerAutoClose() {
        autoCloseScheduler.autoCloseStaleTickets();
        return ResponseEntity.ok(Map.of("status", "triggered"));
    }

    /**
     * POST /api/v1/admin/jobs/audit/run
     */
    @PostMapping("/audit/run")
    public ResponseEntity<Map<String, String>> triggerAudit() {
        auditScheduler.auditDataIntegrity();
        return ResponseEntity.ok(Map.of("status", "triggered"));
    }

    /**
     * POST /api/v1/admin/jobs/geo-cluster/run
     */
    @PostMapping("/geo-cluster/run")
    public ResponseEntity<Map<String, String>> triggerGeoCluster() {
        geoClusterScheduler.rebuildGeoClusters();
        return ResponseEntity.ok(Map.of("status", "triggered"));
    }
}
