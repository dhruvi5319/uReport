package com.ureport.crm;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ureport.domain.*;
import com.ureport.repository.*;
import com.ureport.security.JwtUtil;
import com.ureport.security.PersonDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for the ticket history / action logging system.
 *
 * Uses native sidecar PostgreSQL (no Testcontainers — no Docker daemon in K8s sandbox).
 * DATABASE_URL is injected by the platform; application-test.properties points Flyway
 * at the real database.
 *
 * Test cases:
 * 1. POST /api/tickets/{id}/history with valid action (comment) → 201 with TicketHistoryEntry; sentNotifications is JSON array
 * 2. POST /api/tickets/{id}/history with action="response" and no notes → 400 NOTES_REQUIRED
 * 3. POST /api/tickets/{id}/history with action not in department_actions (staff) → 403 DEPARTMENT_ACTION_FORBIDDEN
 * 4. POST /api/tickets/{id}/history with action not in department_actions (admin) → 201 (admin bypasses filter)
 * 5. GET /api/tickets/{id}/history → 200 with entries sorted by entered_date DESC
 * 6. GET /api/actions → 200 with list containing "open", "closed", "response", "comment" etc.
 * 7. GET /api/categories/{id}/action-responses/{actionId} → 200 with template text
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TicketHistoryIT {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JwtUtil jwtUtil;

    @Autowired TicketRepository ticketRepository;
    @Autowired TicketHistoryRepository ticketHistoryRepository;
    @Autowired PersonRepository personRepository;
    @Autowired CategoryRepository categoryRepository;
    @Autowired DepartmentRepository departmentRepository;
    @Autowired ActionsRepository actionsRepository;
    @Autowired DepartmentActionRepository departmentActionRepository;
    @Autowired CategoryActionResponseRepository categoryActionResponseRepository;
    @Autowired SubstatusRepository substatusRepository;

    private Long staffPersonId;
    private Long adminPersonId;
    private String staffJwt;
    private String adminJwt;
    private Long categoryId;
    private Long departmentId;
    private Long ticketId;

    // Action IDs — populated from seeded actions
    private Long commentActionId;    // department action (configured in department_actions)
    private Long responseActionId;   // system action — for NOTES_REQUIRED test
    private Long restrictedActionId; // action NOT in department_actions for this dept

    @BeforeEach
    void setUp() {
        // ---- Department ----
        Department dept = new Department();
        dept.setName("HistoryTestDept_" + System.nanoTime());
        dept = departmentRepository.save(dept);
        departmentId = dept.getId();

        // ---- Category ----
        Category cat = new Category();
        cat.setName("HistoryTestCat_" + System.nanoTime());
        cat.setActive(true);
        cat.setDepartment(dept);
        cat.setSlaDays(null);
        cat.setDisplayPermissionLevel("staff");
        cat.setPostingPermissionLevel("staff");
        cat.setLastModified(LocalDateTime.now());
        cat = categoryRepository.save(cat);
        categoryId = cat.getId();

        // ---- Staff person ----
        Person staff = new Person();
        staff.setFirstname("HistStaff");
        staff.setLastname("User");
        staff.setUsername("hist_staff_" + System.nanoTime());
        staff.setEmail("hist_staff_" + System.nanoTime() + "@example.com");
        staff.setRole("staff");
        staff = personRepository.save(staff);
        staffPersonId = staff.getId();
        staffJwt = jwtUtil.generateToken(new PersonDetails(staff));

        // ---- Admin person ----
        Person admin = new Person();
        admin.setFirstname("HistAdmin");
        admin.setLastname("User");
        admin.setUsername("hist_admin_" + System.nanoTime());
        admin.setEmail("hist_admin_" + System.nanoTime() + "@example.com");
        admin.setRole("admin");
        admin = personRepository.save(admin);
        adminPersonId = admin.getId();
        adminJwt = jwtUtil.generateToken(new PersonDetails(admin));

        // ---- Look up seeded actions ----
        commentActionId = actionsRepository.findByName("comment")
                .orElseThrow(() -> new IllegalStateException("'comment' action missing from seed"))
                .getId();
        responseActionId = actionsRepository.findByName("response")
                .orElseThrow(() -> new IllegalStateException("'response' action missing from seed"))
                .getId();
        // Use "update" as the restricted action (not configured in dept actions)
        restrictedActionId = actionsRepository.findByName("update")
                .orElseThrow(() -> new IllegalStateException("'update' action missing from seed"))
                .getId();

        // ---- Configure department_actions: only "comment" is allowed for this dept ----
        DepartmentAction da = new DepartmentAction();
        da.setDepartmentId(departmentId);
        da.setActionId(commentActionId);
        departmentActionRepository.save(da);

        // ---- Also allow "response" for the dept ----
        DepartmentAction daResponse = new DepartmentAction();
        daResponse.setDepartmentId(departmentId);
        daResponse.setActionId(responseActionId);
        departmentActionRepository.save(daResponse);

        // ---- Ticket ----
        ticketId = createTestTicket();

        // ---- Category action response template for test 7 ----
        CategoryActionResponse car = new CategoryActionResponse();
        car.setCategoryId(categoryId);
        car.setActionId(commentActionId);
        car.setTemplate("Thank you for your comment. We will review it.");
        categoryActionResponseRepository.save(car);
    }

    // -------------------------------------------------------------------------
    // Test 1: POST /api/tickets/{id}/history with valid action (comment) → 201
    //         sentNotifications is a JSON array
    // -------------------------------------------------------------------------
    @Test
    void logAction_validCommentAction_returns201WithSentNotificationsArray() throws Exception {
        var body = Map.of(
                "actionId", commentActionId,
                "notes", "Testing the comment action"
        );

        String response = mockMvc.perform(post("/api/tickets/{id}/history", ticketId)
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.actionName").value("comment"))
                .andExpect(jsonPath("$.notes").value("Testing the comment action"))
                .andExpect(jsonPath("$.sentNotifications").exists())
                .andReturn()
                .getResponse()
                .getContentAsString();

        // Verify sentNotifications parses as a JSON array (not null, not plain string)
        String sentNotifications = objectMapper.readTree(response).get("sentNotifications").asText();
        assertTrue(sentNotifications.startsWith("["),
                "sentNotifications should be a JSON array string, got: " + sentNotifications);
    }

    // -------------------------------------------------------------------------
    // Test 2: POST with action="response" and no notes → 400 NOTES_REQUIRED
    // -------------------------------------------------------------------------
    @Test
    void logAction_responseActionWithoutNotes_returns400NotesRequired() throws Exception {
        var body = Map.of("actionId", responseActionId);

        mockMvc.perform(post("/api/tickets/{id}/history", ticketId)
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("NOTES_REQUIRED"));
    }

    // -------------------------------------------------------------------------
    // Test 3: STAFF user logs action NOT in department_actions → 403 DEPARTMENT_ACTION_FORBIDDEN
    // -------------------------------------------------------------------------
    @Test
    void logAction_staffUserActionNotInDepartmentActions_returns403() throws Exception {
        // "update" action is NOT in the department_actions for this dept
        var body = Map.of(
                "actionId", restrictedActionId,
                "notes", "Attempting restricted action"
        );

        mockMvc.perform(post("/api/tickets/{id}/history", ticketId)
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("DEPARTMENT_ACTION_FORBIDDEN"));
    }

    // -------------------------------------------------------------------------
    // Test 4: ADMIN user logs same restricted action → 201 (admin bypasses filter)
    // -------------------------------------------------------------------------
    @Test
    void logAction_adminUserActionNotInDepartmentActions_returns201() throws Exception {
        // Admin bypasses the department_actions filter (T-04-12)
        var body = Map.of(
                "actionId", restrictedActionId,
                "notes", "Admin bypasses department filter"
        );

        mockMvc.perform(post("/api/tickets/{id}/history", ticketId)
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.actionName").value("update"));
    }

    // -------------------------------------------------------------------------
    // Test 5: GET /api/tickets/{id}/history → 200 with entries sorted by entered_date DESC
    // -------------------------------------------------------------------------
    @Test
    void getHistory_returnsEntriesSortedByEnteredDateDesc() throws Exception {
        // Create two history entries (with slight delay to ensure ordering)
        var body1 = Map.of("actionId", commentActionId, "notes", "First comment");
        var body2 = Map.of("actionId", commentActionId, "notes", "Second comment");

        mockMvc.perform(post("/api/tickets/{id}/history", ticketId)
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body1)))
                .andExpect(status().isCreated());

        // Short delay to ensure distinct timestamps
        Thread.sleep(10);

        mockMvc.perform(post("/api/tickets/{id}/history", ticketId)
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body2)))
                .andExpect(status().isCreated());

        String response = mockMvc.perform(get("/api/tickets/{id}/history", ticketId)
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(greaterThanOrEqualTo(2)))
                .andReturn()
                .getResponse()
                .getContentAsString();

        // Verify ordering: most recent first (DESC)
        var entries = objectMapper.readTree(response);
        if (entries.size() >= 2) {
            String firstDate = entries.get(0).get("enteredDate").asText();
            String secondDate = entries.get(1).get("enteredDate").asText();
            // ISO 8601 string comparison works for date ordering
            assertTrue(firstDate.compareTo(secondDate) >= 0,
                    "Entries should be sorted by enteredDate DESC. Got first=" + firstDate + " second=" + secondDate);
        }
    }

    // -------------------------------------------------------------------------
    // Test 6: GET /api/actions → 200 with list containing system actions
    // -------------------------------------------------------------------------
    @Test
    void getActions_returnsAllSystemActions() throws Exception {
        mockMvc.perform(get("/api/actions")
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[*].name", hasItems("open", "closed", "response", "comment",
                        "assignment", "update", "changeCategory", "changeLocation",
                        "duplicate", "upload_media")));
    }

    // -------------------------------------------------------------------------
    // Test 7: GET /api/categories/{id}/action-responses/{actionId} → 200 with template
    // -------------------------------------------------------------------------
    @Test
    void getActionResponse_returnsConfiguredTemplate() throws Exception {
        mockMvc.perform(get("/api/categories/{id}/action-responses/{actionId}",
                        categoryId, commentActionId)
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.template").value("Thank you for your comment. We will review it."));
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Creates a minimal ticket via POST /api/tickets and returns its ID.
     */
    private Long createTestTicket() {
        try {
            var body = Map.of(
                    "categoryId", categoryId,
                    "description", "History test ticket",
                    "location", "123 Test Ave"
            );

            String response = mockMvc.perform(post("/api/tickets")
                            .header("Authorization", "Bearer " + staffJwt)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isCreated())
                    .andReturn()
                    .getResponse()
                    .getContentAsString();

            return objectMapper.readTree(response).get("id").asLong();
        } catch (Exception e) {
            throw new RuntimeException("Failed to create test ticket", e);
        }
    }
}
