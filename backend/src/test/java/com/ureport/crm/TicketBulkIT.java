package com.ureport.crm;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ureport.crm.service.SlaService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for POST /api/tickets/bulk and SlaService.
 *
 * Uses Testcontainers (via tc: JDBC URL in application-test.properties) for
 * a real PostgreSQL database with Flyway migration applied.
 *
 * Test cases:
 * 1. bulk assign 3 valid tickets → 200, successCount=3, failureCount=0; all 3 DB rows updated
 * 2. bulk assign with one invalid ticketId → 200, successCount=1, failureCount=1 (TICKET_NOT_FOUND)
 * 3. bulk close → 200, all tickets status=closed in DB; each has a "closed" ticket_history row
 * 4. POST /api/tickets/bulk without JWT → 401
 * 5. SLA unit test: category sla_days=5, ticket entered 10 days ago → isOverdue=true
 * 6. SLA unit test: category sla_days=null → isOverdue=false
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TicketBulkIT {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JwtUtil jwtUtil;
    @Autowired SlaService slaService;

    @Autowired TicketRepository ticketRepository;
    @Autowired TicketHistoryRepository ticketHistoryRepository;
    @Autowired PersonRepository personRepository;
    @Autowired SubstatusRepository substatusRepository;
    @Autowired CategoryRepository categoryRepository;
    @Autowired DepartmentRepository departmentRepository;
    @Autowired ActionsRepository actionsRepository;

    private Long staffPersonId;
    private String staffJwt;
    private Long assigneePersonId;
    private Long resolvedSubstatusId;
    private Department sharedDept;

    @BeforeEach
    void setUp() {
        // Seed a department (required by categories)
        sharedDept = new Department();
        sharedDept.setName("TestDept_" + System.nanoTime());
        sharedDept = departmentRepository.save(sharedDept);

        // Seed a staff person for authentication
        Person staff = new Person();
        staff.setFirstname("Test");
        staff.setLastname("Staff");
        staff.setUsername("teststaff_" + System.nanoTime());
        staff.setEmail("teststaff_" + System.nanoTime() + "@example.com");
        staff.setRole("staff");
        staff = personRepository.save(staff);
        staffPersonId = staff.getId();
        staffJwt = jwtUtil.generateToken(new PersonDetails(staff));

        // Seed an assignee person
        Person assignee = new Person();
        assignee.setFirstname("Assignee");
        assignee.setLastname("Person");
        assignee.setUsername("assignee_" + System.nanoTime());
        assignee.setRole("staff");
        assignee = personRepository.save(assignee);
        assigneePersonId = assignee.getId();

        // Get resolved substatus id (seeded by V1 migration)
        resolvedSubstatusId = substatusRepository.findAll().stream()
            .filter(s -> "Resolved".equals(s.getName()))
            .findFirst()
            .map(Substatus::getId)
            .orElseThrow(() -> new IllegalStateException(
                "Resolved substatus not found — check V1 migration"));
    }

    // -------------------------------------------------------------------------
    // Helper: create a minimal open ticket
    // -------------------------------------------------------------------------
    private Ticket createOpenTicket() {
        Ticket t = new Ticket();
        t.setStatus("open");
        t.setEnteredDate(LocalDateTime.now());
        t.setLastModified(LocalDateTime.now());
        t.setDescription("Test ticket");
        t.setLocation("123 Test St");
        return ticketRepository.save(t);
    }

    // Helper: create category with given sla_days
    private Category createCategory(Integer slaDays) {
        Category cat = new Category();
        cat.setName("TestCat_" + System.nanoTime());
        cat.setActive(true);
        cat.setDepartment(sharedDept);
        cat.setSlaDays(slaDays);
        // Required NOT NULL fields per V1 schema
        cat.setDisplayPermissionLevel("staff");
        cat.setPostingPermissionLevel("staff");
        cat.setLastModified(LocalDateTime.now());
        return categoryRepository.save(cat);
    }

    // -------------------------------------------------------------------------
    // Test 1: bulk assign 3 valid tickets → 200, successCount=3, failureCount=0
    // -------------------------------------------------------------------------
    @Test
    void bulkAssign_3ValidTickets_allSucceed() throws Exception {
        Ticket t1 = createOpenTicket();
        Ticket t2 = createOpenTicket();
        Ticket t3 = createOpenTicket();
        List<Long> ids = List.of(t1.getId(), t2.getId(), t3.getId());

        var body = Map.of(
            "ticketIds", ids,
            "action", "assign",
            "assignedPersonId", assigneePersonId
        );

        mockMvc.perform(post("/api/tickets/bulk")
                .header("Authorization", "Bearer " + staffJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.successCount").value(3))
            .andExpect(jsonPath("$.failureCount").value(0))
            .andExpect(jsonPath("$.perTicketResults", hasSize(3)))
            .andExpect(jsonPath("$.perTicketResults[*].success", everyItem(is(true))));

        // Verify DB: all 3 tickets have assignedPerson updated
        ids.forEach(id -> {
            Ticket reloaded = ticketRepository.findById(id).orElseThrow();
            assertNotNull(reloaded.getAssignedPerson(),
                "Ticket " + id + " should have assignedPerson set");
            assertEquals(assigneePersonId, reloaded.getAssignedPerson().getId(),
                "Ticket " + id + " assignedPerson should be " + assigneePersonId);
        });
    }

    // -------------------------------------------------------------------------
    // Test 2: one valid + one invalid ticketId → successCount=1, failureCount=1
    // -------------------------------------------------------------------------
    @Test
    void bulkAssign_oneInvalidTicketId_partialSuccess() throws Exception {
        Ticket t1 = createOpenTicket();
        long nonExistentId = 999_999_999L;

        var body = Map.of(
            "ticketIds", List.of(t1.getId(), nonExistentId),
            "action", "assign",
            "assignedPersonId", assigneePersonId
        );

        mockMvc.perform(post("/api/tickets/bulk")
                .header("Authorization", "Bearer " + staffJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.successCount").value(1))
            .andExpect(jsonPath("$.failureCount").value(1))
            .andExpect(jsonPath("$.perTicketResults", hasSize(2)));

        // Verify DB: valid ticket was assigned
        Ticket reloaded = ticketRepository.findById(t1.getId()).orElseThrow();
        assertNotNull(reloaded.getAssignedPerson());
    }

    // -------------------------------------------------------------------------
    // Test 3: bulk close → all tickets status=closed; each has a "closed" history row
    // -------------------------------------------------------------------------
    @Test
    void bulkClose_validTickets_allClosed() throws Exception {
        Ticket t1 = createOpenTicket();
        Ticket t2 = createOpenTicket();
        List<Long> ids = List.of(t1.getId(), t2.getId());

        var body = Map.of(
            "ticketIds", ids,
            "action", "close",
            "substatusId", resolvedSubstatusId
        );

        mockMvc.perform(post("/api/tickets/bulk")
                .header("Authorization", "Bearer " + staffJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.successCount").value(2))
            .andExpect(jsonPath("$.failureCount").value(0));

        // Verify DB: both tickets have status=closed and a "closed" history row
        Long closedActionId = actionsRepository.findByName("closed")
            .map(Action::getId)
            .orElseThrow(() -> new IllegalStateException("'closed' action not found"));

        ids.forEach(id -> {
            Ticket reloaded = ticketRepository.findById(id).orElseThrow();
            assertEquals("closed", reloaded.getStatus(),
                "Ticket " + id + " should be closed");
            assertNotNull(reloaded.getClosedDate(),
                "Ticket " + id + " should have closedDate set");

            List<TicketHistory> history = ticketHistoryRepository
                .findByTicketIdOrderByEnteredDateDesc(id);
            assertTrue(history.stream().anyMatch(h -> closedActionId.equals(h.getActionId())),
                "Ticket " + id + " should have a 'closed' history row");
        });
    }

    // -------------------------------------------------------------------------
    // Test 4: no JWT → 401
    // -------------------------------------------------------------------------
    @Test
    void bulkAssign_noJwt_returns401() throws Exception {
        var body = Map.of(
            "ticketIds", List.of(1L),
            "action", "assign",
            "assignedPersonId", 1L
        );

        mockMvc.perform(post("/api/tickets/bulk")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isUnauthorized());
    }

    // -------------------------------------------------------------------------
    // Test 5: SLA unit test — sla_days=5, ticket entered 10 days ago → isOverdue=true
    // -------------------------------------------------------------------------
    @Test
    void slaIsOverdue_ticketOlderThanSlaDays_returnsTrue() {
        Category cat = createCategory(5);

        Ticket ticket = new Ticket();
        ticket.setStatus("open");
        ticket.setEnteredDate(LocalDateTime.now().minusDays(10));
        ticket.setLastModified(LocalDateTime.now());
        ticket = ticketRepository.save(ticket);

        assertTrue(slaService.isOverdue(ticket, cat),
            "Ticket entered 10 days ago with sla_days=5 should be overdue");
    }

    // -------------------------------------------------------------------------
    // Test 6: SLA unit test — sla_days=null → isOverdue=false
    // -------------------------------------------------------------------------
    @Test
    void slaIsOverdue_nullSlaDays_returnsFalse() {
        Category cat = createCategory(null);

        Ticket ticket = new Ticket();
        ticket.setStatus("open");
        ticket.setEnteredDate(LocalDateTime.now().minusDays(100));
        ticket.setLastModified(LocalDateTime.now());
        ticket = ticketRepository.save(ticket);

        assertFalse(slaService.isOverdue(ticket, cat),
            "Ticket with null sla_days should never be overdue");
    }
}
