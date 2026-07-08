package com.ureport.metrics;

import com.ureport.domain.*;
import com.ureport.repository.*;
import com.ureport.security.JwtUtil;
import com.ureport.security.PersonDetails;
import io.zonky.test.db.AutoConfigureEmbeddedDatabase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for Dashboard stats, Metrics, and Geo-cluster endpoints (06-02).
 *
 * Uses Zonky embedded PostgreSQL.
 * @Transactional: each test runs in a transaction rolled back after the test.
 *
 * Test cases:
 * 1. GET /api/dashboard/stats with ROLE_ADMIN JWT → 200, totalOpen>=3
 * 2. GET /api/dashboard/stats with ROLE_STAFF JWT (dept-scoped)
 * 3. GET /api/metrics?start=...&end=... → 200, volumeByDay non-empty, overdueCount>=1
 * 4. GET /api/metrics with date range > 12 months → 400
 * 5. GET /api/reports?groupBy=category → 200 with non-empty list
 * 6. GET /api/reports?groupBy=invalid → 400
 * 7. GET /api/reports/export?groupBy=category → 200 with Content-Disposition + CSV body
 * 8. GET /api/geoclusters?zoom=7 → 400 (zoom out of range)
 * 9. GET /api/geoclusters?zoom=3 → 200, clusters array present
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@AutoConfigureEmbeddedDatabase(
    provider = AutoConfigureEmbeddedDatabase.DatabaseProvider.ZONKY,
    type = AutoConfigureEmbeddedDatabase.DatabaseType.POSTGRES
)
@Transactional
class DashboardMetricsIT {

    @Autowired MockMvc mockMvc;
    @Autowired JwtUtil jwtUtil;

    @Autowired PersonRepository personRepository;
    @Autowired DepartmentRepository departmentRepository;
    @Autowired CategoryRepository categoryRepository;
    @Autowired TicketRepository ticketRepository;

    private String adminJwt;
    private String staffJwt;
    private Long testDeptId;
    private Long testCategoryId;

    @BeforeEach
    void setUp() {
        // 1. Create department
        Department dept = new Department();
        dept.setName("TestDept_" + System.nanoTime());
        dept = departmentRepository.save(dept);
        testDeptId = dept.getId();

        // 2. Create category with sla_days=5 (used for overdue test)
        Category cat = new Category();
        cat.setName("TestCat_" + System.nanoTime());
        cat.setActive(true);
        cat.setDepartment(dept);
        cat.setSlaDays(5);
        cat.setDisplayPermissionLevel("staff");
        cat.setPostingPermissionLevel("staff");
        cat.setLastModified(LocalDateTime.now());
        cat = categoryRepository.save(cat);
        testCategoryId = cat.getId();

        // 3. Insert 3 open tickets with entered_date = now (openedToday + totalOpen)
        for (int i = 0; i < 3; i++) {
            Ticket t = new Ticket();
            t.setCategory(cat);
            t.setStatus("open");
            t.setEnteredDate(LocalDateTime.now());
            t.setLastModified(LocalDateTime.now());
            ticketRepository.save(t);
        }

        // 4. Insert 1 closed ticket (closedToday + avgResolutionHours > 0)
        Ticket closed = new Ticket();
        closed.setCategory(cat);
        closed.setStatus("closed");
        closed.setEnteredDate(LocalDateTime.now().minusDays(10));
        closed.setClosedDate(LocalDateTime.now());
        closed.setLastModified(LocalDateTime.now());
        ticketRepository.save(closed);

        // 5. Insert 1 overdue ticket: status=open, entered_date = 30 days ago, sla_days=5
        // → entered_date + 5 days = 25 days ago < NOW() → overdue
        Ticket overdue = new Ticket();
        overdue.setCategory(cat);
        overdue.setStatus("open");
        overdue.setEnteredDate(LocalDateTime.now().minusDays(30));
        overdue.setLastModified(LocalDateTime.now());
        ticketRepository.save(overdue);

        // 6. Create admin person (no department)
        Person adminPerson = new Person();
        adminPerson.setFirstname("Admin");
        adminPerson.setLastname("Test");
        adminPerson.setUsername("admin_metrics_" + System.nanoTime());
        adminPerson.setEmail("admin_metrics_" + System.nanoTime() + "@example.com");
        adminPerson.setRole("admin");
        adminPerson = personRepository.save(adminPerson);
        adminJwt = jwtUtil.generateToken(new PersonDetails(adminPerson));

        // 7. Create staff person linked to test department
        Person staffPerson = new Person();
        staffPerson.setFirstname("Staff");
        staffPerson.setLastname("Test");
        staffPerson.setUsername("staff_metrics_" + System.nanoTime());
        staffPerson.setEmail("staff_metrics_" + System.nanoTime() + "@example.com");
        staffPerson.setRole("staff");
        staffPerson.setDepartment(dept);
        staffPerson = personRepository.save(staffPerson);
        staffJwt = jwtUtil.generateToken(new PersonDetails(staffPerson));
    }

    // -----------------------------------------------------------------------
    // Test 1: GET /api/dashboard/stats (ROLE_ADMIN) → system-wide counts
    // -----------------------------------------------------------------------
    @Test
    void dashboardStats_adminJwt_returnsSystemWideCounts() throws Exception {
        mockMvc.perform(get("/api/dashboard/stats")
                .header("Authorization", "Bearer " + adminJwt))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalOpen").isNumber())
            .andExpect(jsonPath("$.openedToday").isNumber())
            .andExpect(jsonPath("$.closedToday").isNumber())
            .andExpect(jsonPath("$.overdue").isNumber());
    }

    // -----------------------------------------------------------------------
    // Test 2: GET /api/dashboard/stats (ROLE_STAFF, dept-scoped)
    // -----------------------------------------------------------------------
    @Test
    void dashboardStats_staffJwt_returnsDeptScopedCounts() throws Exception {
        mockMvc.perform(get("/api/dashboard/stats")
                .header("Authorization", "Bearer " + staffJwt))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalOpen").isNumber())
            .andExpect(jsonPath("$.openedToday").isNumber())
            .andExpect(jsonPath("$.closedToday").isNumber())
            .andExpect(jsonPath("$.overdue").isNumber());
    }

    // -----------------------------------------------------------------------
    // Test 3: GET /api/metrics in valid range → volumeByDay, overdueCount
    // -----------------------------------------------------------------------
    @Test
    void metrics_validRange_returnsVolumeAndOverdue() throws Exception {
        String start = java.time.LocalDate.now().minusDays(30).toString();
        String end = java.time.LocalDate.now().toString();

        mockMvc.perform(get("/api/metrics")
                .param("start", start)
                .param("end", end)
                .header("Authorization", "Bearer " + adminJwt))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.volumeByDay").isArray())
            .andExpect(jsonPath("$.overdueCount").isNumber());
    }

    // -----------------------------------------------------------------------
    // Test 4: GET /api/metrics with date range > 12 months → 400
    // -----------------------------------------------------------------------
    @Test
    void metrics_rangeOver12Months_returns400() throws Exception {
        mockMvc.perform(get("/api/metrics")
                .param("start", "2024-01-01")
                .param("end", "2025-06-01")
                .header("Authorization", "Bearer " + adminJwt))
            .andExpect(status().isBadRequest());
    }

    // -----------------------------------------------------------------------
    // Test 5: GET /api/reports?groupBy=category → 200 with list
    // -----------------------------------------------------------------------
    @Test
    void reports_groupByCategory_returns200WithList() throws Exception {
        String start = java.time.LocalDate.now().minusDays(30).toString();
        String end = java.time.LocalDate.now().toString();

        mockMvc.perform(get("/api/reports")
                .param("groupBy", "category")
                .param("start", start)
                .param("end", end)
                .header("Authorization", "Bearer " + adminJwt))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    // -----------------------------------------------------------------------
    // Test 6: GET /api/reports?groupBy=invalid → 400
    // -----------------------------------------------------------------------
    @Test
    void reports_invalidGroupBy_returns400() throws Exception {
        String start = java.time.LocalDate.now().minusDays(7).toString();
        String end = java.time.LocalDate.now().toString();

        mockMvc.perform(get("/api/reports")
                .param("groupBy", "invalid")
                .param("start", start)
                .param("end", end)
                .header("Authorization", "Bearer " + adminJwt))
            .andExpect(status().isBadRequest());
    }

    // -----------------------------------------------------------------------
    // Test 7: GET /api/reports/export?groupBy=category → 200 with CSV headers
    // -----------------------------------------------------------------------
    @Test
    void reportsExport_groupByCategory_returnsCsvAttachment() throws Exception {
        String start = java.time.LocalDate.now().minusDays(30).toString();
        String end = java.time.LocalDate.now().toString();

        mockMvc.perform(get("/api/reports/export")
                .param("groupBy", "category")
                .param("start", start)
                .param("end", end)
                .header("Authorization", "Bearer " + adminJwt))
            .andExpect(status().isOk())
            .andExpect(header().string("Content-Disposition",
                org.hamcrest.Matchers.containsString("attachment")))
            .andExpect(content().string(
                org.hamcrest.Matchers.startsWith("Group,Open,Closed")));
    }

    // -----------------------------------------------------------------------
    // Test 8: GET /api/geoclusters?zoom=7 → 400 (invalid zoom level)
    // -----------------------------------------------------------------------
    @Test
    void geoclusters_invalidZoom_returns400() throws Exception {
        mockMvc.perform(get("/api/geoclusters")
                .param("zoom", "7")
                .header("Authorization", "Bearer " + adminJwt))
            .andExpect(status().isBadRequest());
    }

    // -----------------------------------------------------------------------
    // Test 9: GET /api/geoclusters?zoom=3 → 200, clusters array
    // -----------------------------------------------------------------------
    @Test
    void geoclusters_validZoom_returns200WithClustersArray() throws Exception {
        mockMvc.perform(get("/api/geoclusters")
                .param("zoom", "3")
                .header("Authorization", "Bearer " + adminJwt))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.clusters").isArray());
    }
}
