package com.ureport.dashboard.service;

import com.ureport.dashboard.dto.ChartSegmentDto;
import com.ureport.dashboard.dto.DashboardChartDto;
import com.ureport.dashboard.dto.DashboardStatsDto;
import com.ureport.domain.Person;
import com.ureport.repository.DashboardRepository;
import com.ureport.repository.PersonRepository;
import com.ureport.security.CustomUserDetails;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Dashboard statistics service.
 *
 * ROLE_ADMIN: system-wide counts (deptId = null → no department filter)
 * ROLE_STAFF: dept-scoped counts (deptId from person.department via DB lookup)
 *
 * T-06-09 mitigated: departmentId is derived from the JWT principal's personId
 * via a DB lookup — never from a client-supplied request parameter.
 */
@Service
public class DashboardService {

    private static final Set<String> VALID_CHART_GROUP_BY = Set.of("status", "category", "department");

    private final DashboardRepository dashboardRepository;
    private final PersonRepository personRepository;

    public DashboardService(DashboardRepository dashboardRepository,
                            PersonRepository personRepository) {
        this.dashboardRepository = dashboardRepository;
        this.personRepository = personRepository;
    }

    public DashboardStatsDto getStats(CustomUserDetails currentUser) {
        boolean isAdmin = currentUser.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        Long deptId = null;
        if (!isAdmin) {
            // Fetch person from DB to get department — deptId from JWT principal, never from request
            Person person = personRepository.findById(currentUser.getPersonId()).orElse(null);
            if (person != null && person.getDepartment() != null) {
                deptId = person.getDepartment().getId();
            }
        }

        long totalOpen = dashboardRepository.countTotalOpen(deptId);
        long openedToday = dashboardRepository.countOpenedToday(deptId);
        long closedToday = dashboardRepository.countClosedToday(deptId);
        long overdue = dashboardRepository.countOverdue(deptId);

        return new DashboardStatsDto(totalOpen, openedToday, closedToday, overdue);
    }

    public DashboardChartDto getChartData(String groupBy) {
        if (!VALID_CHART_GROUP_BY.contains(groupBy)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "groupBy must be status, category, or department");
        }

        List<Object[]> rows = switch (groupBy) {
            case "status" -> dashboardRepository.chartByStatus();
            case "category" -> dashboardRepository.chartByCategory();
            case "department" -> dashboardRepository.chartByDepartment();
            default -> throw new IllegalStateException("unreachable after whitelist check");
        };

        List<ChartSegmentDto> segments = rows.stream()
            .map(row -> new ChartSegmentDto(
                (String) row[0],
                ((Number) row[1]).longValue()))
            .collect(Collectors.toList());

        return new DashboardChartDto(groupBy, segments);
    }
}
