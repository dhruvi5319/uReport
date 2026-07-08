package com.ureport.dashboard.controller;

import com.ureport.dashboard.dto.DashboardChartDto;
import com.ureport.dashboard.dto.DashboardStatsDto;
import com.ureport.dashboard.service.DashboardService;
import com.ureport.security.CustomUserDetails;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/stats")
    public DashboardStatsDto getStats(@AuthenticationPrincipal CustomUserDetails currentUser) {
        return dashboardService.getStats(currentUser);
    }

    @GetMapping("/chart")
    public DashboardChartDto getChart(@RequestParam String groupBy) {
        return dashboardService.getChartData(groupBy);
    }
}
