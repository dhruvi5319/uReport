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
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for the core ticket lifecycle controller.
 *
 * Uses native sidecar PostgreSQL (no Testcontainers — no Docker daemon in K8s sandbox).
 * DATABASE_URL is injected by the platform; application-test.properties points Flyway
 * at the real database.
 *
 * Test cases:
 * 1. POST /api/tickets with valid staff JWT → 201, status=open; ticket_history has "open" row
 * 2. POST /api/tickets/{id}/close → 200, status=closed, closedDate not null; history has "closed" row
 * 3. POST /api/tickets/{id}/reopen → 200, status=open, closedDate null; history has new "open" row
 * 4. GET /api/tickets/{id} after create → isOverdue=false, slaDueDate null/future, mediaCount=0
 * 5. POST /api/tickets without JWT → 401
 * 6. POST /api/tickets with public-role JWT → 403
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TicketControllerIT {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JwtUtil jwtUtil;

    @Autowired TicketRepository ticketRepository;
    @Autowired TicketHistoryRepository ticketHistoryRepository;
    @Autowired PersonRepository personRepository;
    @Autowired SubstatusRepository substatusRepository;
    @Autowired CategoryRepository categoryRepository;
    @Autowired DepartmentRepository departmentRepository;
    @Autowired ActionsRepository actionsRepository;

    private Long staffPersonId;
    private String staffJwt;
    private String publicJwt;
    private Long categoryId;
    private Long resolvedSubstatusId;

    @BeforeEach
    void setUp() {
        // Seed a department (required by categories)
        Department dept = new Department();
        dept.setName("TestDept_" + System.nanoTime());
        dept = departmentRepository.save(dept);

        // Seed a category with sla_days=null (so slaDueDate=null)
        Category cat = new Category();
        cat.setName("TestCat_" + System.nanoTime());
        cat.setActive(true);
        cat.setDepartment(dept);
        cat.setSlaDays(null); // null sla_days → slaDueDate=null, isOverdue=false
        cat.setDisplayPermissionLevel("staff");
        cat.setPostingPermissionLevel("staff");
        cat.setLastModified(LocalDateTime.now());
        cat = categoryRepository.save(cat);
        categoryId = cat.getId();

        // Seed a staff person for authentication
        Person staff = new Person();
        staff.setFirstname("Staff");
        staff.setLastname("User");
        staff.setUsername("staff_" + System.nanoTime());
        staff.setEmail("staff_" + System.nanoTime() + "@example.com");
        staff.setRole("staff");
        staff = personRepository.save(staff);
        staffPersonId = staff.getId();
        staffJwt = jwtUtil.generateToken(new PersonDetails(staff));

        // Seed a public person (role=public) to test 403
        Person pub = new Person();
        pub.setFirstname("Public");
        pub.setLastname("User");
        pub.setUsername("pub_" + System.nanoTime());
        pub.setEmail("pub_" + System.nanoTime() + "@example.com");
        pub.setRole("public");
        pub = personRepository.save(pub);
        publicJwt = jwtUtil.generateToken(new PersonDetails(pub));

        // Get the "Resolved" substatus id (seeded by V1 Flyway migration)
        resolvedSubstatusId = substatusRepository.findAll().stream()
                .filter(s -> "Resolved".equals(s.getName()))
                .findFirst()
                .map(Substatus::getId)
                .orElseThrow(() -> new IllegalStateException(
                        "Resolved substatus not found — check V1 Flyway migration"));
    }

    // -------------------------------------------------------------------------
    // Test 1: POST /api/tickets — create ticket, verify status=open + history
    // -------------------------------------------------------------------------
    @Test
    void createTicket_validStaffJwt_returns201WithOpenStatus() throws Exception {
        var body = Map.of(
                "categoryId", categoryId,
                "description", "Integration test ticket",
                "location", "123 Main St"
        );

        String response = mockMvc.perform(post("/api/tickets")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.status").value("open"))
                .andExpect(jsonPath("$.closedDate").doesNotExist())
                .andReturn()
                .getResponse()
                .getContentAsString();

        // Extract ticket id for DB verification
        Long ticketId = objectMapper.readTree(response).get("id").asLong();

        // Verify ticket_history has an "open" row
        Long openActionId = actionsRepository.findByName("open")
                .map(Action::getId)
                .orElseThrow(() -> new IllegalStateException("'open' action missing from seed data"));

        List<TicketHistory> history = ticketHistoryRepository
                .findByTicketIdOrderByEnteredDateDesc(ticketId);
        assertFalse(history.isEmpty(), "ticket_history should not be empty after create");
        assertTrue(history.stream().anyMatch(h -> openActionId.equals(h.getActionId())),
                "ticket_history should contain an 'open' action row after create");
    }

    // -------------------------------------------------------------------------
    // Test 2: POST /api/tickets/{id}/close — close the ticket, verify history
    // -------------------------------------------------------------------------
    @Test
    void closeTicket_openTicket_returns200WithClosedStatus() throws Exception {
        // First create a ticket
        Long ticketId = createTestTicket();

        var closeBody = Map.of("substatusId", resolvedSubstatusId);

        mockMvc.perform(post("/api/tickets/{id}/close", ticketId)
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(closeBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("closed"))
                .andExpect(jsonPath("$.closedDate").isString());

        // Verify DB: ticket has status=closed
        Ticket reloaded = ticketRepository.findById(ticketId).orElseThrow();
        assertEquals("closed", reloaded.getStatus());
        assertNotNull(reloaded.getClosedDate(), "closedDate should be set after close");

        // Verify ticket_history has a "closed" row
        Long closedActionId = actionsRepository.findByName("closed")
                .map(Action::getId)
                .orElseThrow(() -> new IllegalStateException("'closed' action missing from seed data"));

        List<TicketHistory> history = ticketHistoryRepository
                .findByTicketIdOrderByEnteredDateDesc(ticketId);
        assertTrue(history.stream().anyMatch(h -> closedActionId.equals(h.getActionId())),
                "ticket_history should contain a 'closed' action row after close");
    }

    // -------------------------------------------------------------------------
    // Test 3: POST /api/tickets/{id}/reopen — reopen the ticket, verify history
    // -------------------------------------------------------------------------
    @Test
    void reopenTicket_closedTicket_returns200WithOpenStatus() throws Exception {
        // Create and close a ticket first
        Long ticketId = createTestTicket();
        closeTestTicket(ticketId);

        // Reopen
        mockMvc.perform(post("/api/tickets/{id}/reopen", ticketId)
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("open"))
                .andExpect(jsonPath("$.closedDate").value(nullValue()));

        // Verify DB: ticket has status=open, closedDate=null
        Ticket reloaded = ticketRepository.findById(ticketId).orElseThrow();
        assertEquals("open", reloaded.getStatus());
        assertNull(reloaded.getClosedDate(), "closedDate should be null after reopen");

        // Verify ticket_history has a new "open" row (there should now be at least 2: create + reopen)
        Long openActionId = actionsRepository.findByName("open")
                .map(Action::getId)
                .orElseThrow(() -> new IllegalStateException("'open' action missing from seed data"));

        List<TicketHistory> history = ticketHistoryRepository
                .findByTicketIdOrderByEnteredDateDesc(ticketId);
        long openCount = history.stream()
                .filter(h -> openActionId.equals(h.getActionId()))
                .count();
        assertTrue(openCount >= 2,
                "ticket_history should have at least 2 'open' rows (initial + reopen), got: " + openCount);
    }

    // -------------------------------------------------------------------------
    // Test 4: GET /api/tickets/{id} — SLA fields and mediaCount
    // -------------------------------------------------------------------------
    @Test
    void getTicket_afterCreate_returnsIsOverdueFalseAndMediaCountZero() throws Exception {
        Long ticketId = createTestTicket();

        mockMvc.perform(get("/api/tickets/{id}", ticketId)
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(ticketId))
                .andExpect(jsonPath("$.isOverdue").value(false))
                .andExpect(jsonPath("$.mediaCount").value(0));
        // slaDueDate is null when category.sla_days is null — this is valid
    }

    // -------------------------------------------------------------------------
    // Test 5: POST /api/tickets without JWT → 401
    // -------------------------------------------------------------------------
    @Test
    void createTicket_noJwt_returns401() throws Exception {
        var body = Map.of(
                "categoryId", categoryId,
                "description", "No auth test",
                "location", "123 Main St"
        );

        mockMvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isUnauthorized());
    }

    // -------------------------------------------------------------------------
    // Test 6: POST /api/tickets with public-role JWT → 403
    // -------------------------------------------------------------------------
    @Test
    void createTicket_publicRoleJwt_returns403() throws Exception {
        var body = Map.of(
                "categoryId", categoryId,
                "description", "Public role test",
                "location", "123 Main St"
        );

        mockMvc.perform(post("/api/tickets")
                        .header("Authorization", "Bearer " + publicJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isForbidden());
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Creates a minimal open ticket via POST /api/tickets and returns its ID.
     */
    private Long createTestTicket() throws Exception {
        var body = Map.of(
                "categoryId", categoryId,
                "description", "Test ticket for lifecycle",
                "location", "456 Test Ave"
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
    }

    /**
     * Closes a ticket via POST /api/tickets/{id}/close using Resolved substatus.
     */
    private void closeTestTicket(Long ticketId) throws Exception {
        var closeBody = Map.of("substatusId", resolvedSubstatusId);

        mockMvc.perform(post("/api/tickets/{id}/close", ticketId)
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(closeBody)))
                .andExpect(status().isOk());
    }
}
