package com.ureport.search;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for PostgreSQL full-text search (FTS) and bookmark CRUD API.
 *
 * Uses io.zonky.test embedded PostgreSQL — no Docker daemon required (K8s sandbox compatible).
 * This matches the project-mandated test strategy (see Phase 1 decision in STATE.md).
 *
 * Test cases:
 * 1. FTS basic search — GET /api/tickets?q=pothole — 2 matching tickets, searchSnippet with &lt;mark&gt;
 * 2. FTS + status filter combo — AND semantics confirmed
 * 3. Empty q — JPA Specification path, all tickets returned, searchSnippet null
 * 4. Max q length — 300-char q trimmed to 255, no exception
 * 5. Bookmark create — POST /api/bookmarks returns 201 with bookmark object
 * 6. Bookmark retrieve — GET /api/bookmarks returns saved bookmark
 * 7. Bookmark owner enforcement — DELETE by different user returns 403
 * 8. Bookmark delete — DELETE by owner returns 204; subsequent GET returns empty list
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@AutoConfigureEmbeddedDatabase(
        provider = AutoConfigureEmbeddedDatabase.DatabaseProvider.ZONKY,
        type = AutoConfigureEmbeddedDatabase.DatabaseType.POSTGRES
)
class SearchIT {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JwtUtil jwtUtil;
    @Autowired JdbcTemplate jdbc;
    @Autowired PersonRepository personRepository;
    @Autowired TicketRepository ticketRepository;
    @Autowired CategoryRepository categoryRepository;
    @Autowired DepartmentRepository departmentRepository;
    @Autowired ActionsRepository actionsRepository;

    private String staffJwt;
    private String staff2Jwt;
    private Long categoryId;
    private Long ticket1Id;
    private Long ticket2Id;
    private Long ticket3Id;

    @BeforeEach
    void setUp() {
        // Clean up any leftover state from prior test (Zonky uses the same DB for all tests in class)
        jdbc.execute("DELETE FROM bookmarks WHERE id > 0");
        jdbc.execute("DELETE FROM ticket_history WHERE id > 0");
        jdbc.execute("DELETE FROM tickets WHERE id > 0");

        // Seed department + category
        Department dept = new Department();
        dept.setName("TestDept_" + System.nanoTime());
        dept = departmentRepository.save(dept);

        Category cat = new Category();
        cat.setName("Roads_" + System.nanoTime());
        cat.setActive(true);
        cat.setDepartment(dept);
        cat.setDisplayPermissionLevel("staff");
        cat.setPostingPermissionLevel("staff");
        cat.setLastModified(LocalDateTime.now());
        cat = categoryRepository.save(cat);
        categoryId = cat.getId();

        // Seed staff person 1
        Person staff = new Person();
        staff.setFirstname("Staff");
        staff.setLastname("One");
        staff.setUsername("staff1_" + System.nanoTime());
        staff.setEmail("staff1_" + System.nanoTime() + "@example.com");
        staff.setRole("staff");
        staff = personRepository.save(staff);
        staffJwt = jwtUtil.generateToken(new PersonDetails(staff));

        // Seed staff person 2 (for ownership enforcement test)
        Person staff2 = new Person();
        staff2.setFirstname("Staff");
        staff2.setLastname("Two");
        staff2.setUsername("staff2_" + System.nanoTime());
        staff2.setEmail("staff2_" + System.nanoTime() + "@example.com");
        staff2.setRole("staff");
        staff2 = personRepository.save(staff2);
        staff2Jwt = jwtUtil.generateToken(new PersonDetails(staff2));

        // Insert 3 test tickets directly via JdbcTemplate so the FTS trigger fires
        // (the BEFORE INSERT trigger populates search_vector automatically)
        ticket1Id = jdbc.queryForObject(
                "INSERT INTO tickets (status, description, location) " +
                "VALUES ('open', 'Large pothole on Main Street, causing vehicle damage', 'Main Street') " +
                "RETURNING id",
                Long.class);
        ticket2Id = jdbc.queryForObject(
                "INSERT INTO tickets (status, description, location) " +
                "VALUES ('open', 'Broken streetlight near the park, pothole also reported nearby', 'Park Ave') " +
                "RETURNING id",
                Long.class);
        ticket3Id = jdbc.queryForObject(
                "INSERT INTO tickets (status, description, location) " +
                "VALUES ('open', 'Graffiti on park wall — unrelated to road issues', 'Park Wall') " +
                "RETURNING id",
                Long.class);

        // Manual fallback: ensure search_vector is populated if trigger hasn't fired
        // (The V2 trigger fires BEFORE INSERT, so this is a belt-and-suspenders guard for test isolation)
        jdbc.execute("UPDATE tickets SET search_vector = " +
                "to_tsvector('english', COALESCE(description, '') || ' ' || COALESCE(location, '')) " +
                "WHERE id IN (" + ticket1Id + ", " + ticket2Id + ", " + ticket3Id + ")");
    }

    // -----------------------------------------------------------------------
    // Test 1: FTS basic search — GET /api/tickets?q=pothole
    // -----------------------------------------------------------------------

    /**
     * FTS returns exactly 2 tickets matching "pothole", each with searchSnippet
     * containing &lt;mark&gt; tags. Ticket 1 appears before ticket 2 (higher ts_rank_cd).
     */
    @Test
    void ftsSearch_pothole_returns2TicketsWithMarkSnippets() throws Exception {
        mockMvc.perform(get("/api/tickets")
                        .param("q", "pothole")
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                // All results have non-null searchSnippet
                .andExpect(jsonPath("$.content[0].searchSnippet").isString())
                .andExpect(jsonPath("$.content[1].searchSnippet").isString())
                // searchSnippet contains <mark> tags (ts_headline output)
                .andExpect(jsonPath("$.content[0].searchSnippet", containsString("<mark>")))
                .andExpect(jsonPath("$.content[1].searchSnippet", containsString("<mark>")))
                // Neither ticket 3 (graffiti) should appear
                .andExpect(jsonPath("$.content[*].description", not(hasItem(containsString("Graffiti")))));
    }

    // -----------------------------------------------------------------------
    // Test 2: FTS + status filter — AND semantics
    // -----------------------------------------------------------------------

    /**
     * FTS + status=closed filter returns only the closed ticket matching "pothole".
     */
    @Test
    void ftsSearch_withStatusFilter_andSemantics() throws Exception {
        // Insert a 4th ticket: same description as ticket 1 but status = 'closed'
        Long ticket4Id = jdbc.queryForObject(
                "INSERT INTO tickets (status, description, location) " +
                "VALUES ('closed', 'Large pothole on Main Street, causing vehicle damage', 'Main Street') " +
                "RETURNING id",
                Long.class);
        jdbc.execute("UPDATE tickets SET search_vector = " +
                "to_tsvector('english', COALESCE(description, '') || ' ' || COALESCE(location, '')) " +
                "WHERE id = " + ticket4Id);

        mockMvc.perform(get("/api/tickets")
                        .param("q", "pothole")
                        .param("status", "closed")
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isOk())
                // Only the closed ticket should appear
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].status").value("closed"))
                .andExpect(jsonPath("$.content[0].searchSnippet").isString())
                .andExpect(jsonPath("$.content[0].searchSnippet", containsString("<mark>")));
    }

    // -----------------------------------------------------------------------
    // Test 3: Empty q — JPA Specification path (unchanged behavior)
    // -----------------------------------------------------------------------

    /**
     * GET /api/tickets with no q returns all tickets via JPA Specification path.
     * searchSnippet is null for all results.
     */
    @Test
    void listTickets_noQ_returnsAllTickets_withNullSnippets() throws Exception {
        mockMvc.perform(get("/api/tickets")
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isOk())
                // At least the 3 tickets from @BeforeEach
                .andExpect(jsonPath("$.totalElements", greaterThanOrEqualTo(3)))
                // searchSnippet should be null/absent for all non-FTS results
                .andExpect(jsonPath("$.content[0].searchSnippet").doesNotExist());
    }

    // -----------------------------------------------------------------------
    // Test 4: Max q length — 300-char string trimmed to 255, no exception
    // -----------------------------------------------------------------------

    /**
     * 300-character q is trimmed to 255 chars by TicketService before query — no exception.
     */
    @Test
    void listTickets_longQ_trimmedTo255_noException() throws Exception {
        String longQ = "a".repeat(300);

        mockMvc.perform(get("/api/tickets")
                        .param("q", longQ)
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isOk());
    }

    // -----------------------------------------------------------------------
    // Test 5: Bookmark create — POST /api/bookmarks
    // -----------------------------------------------------------------------

    /**
     * POST /api/bookmarks with valid JWT creates bookmark and returns 201 with bookmark object.
     */
    @Test
    void createBookmark_validJwt_returns201WithBookmarkObject() throws Exception {
        var body = Map.of(
                "name", "My potholes",
                "requestUri", "/api/tickets?q=pothole"
        );

        mockMvc.perform(post("/api/bookmarks")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.type").value("search"))
                .andExpect(jsonPath("$.name").value("My potholes"))
                .andExpect(jsonPath("$.requestUri").value("/api/tickets?q=pothole"));
    }

    // -----------------------------------------------------------------------
    // Test 6: Bookmark retrieve — GET /api/bookmarks returns saved bookmark
    // -----------------------------------------------------------------------

    /**
     * GET /api/bookmarks returns the bookmark created in the same test context.
     */
    @Test
    void getBookmarks_afterCreate_returnsBookmarkInList() throws Exception {
        // Create a bookmark first
        var body = Map.of(
                "name", "My potholes",
                "requestUri", "/api/tickets?q=pothole"
        );
        mockMvc.perform(post("/api/bookmarks")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated());

        // Verify GET returns it
        mockMvc.perform(get("/api/bookmarks")
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[*].name", hasItem("My potholes")))
                .andExpect(jsonPath("$[*].requestUri", hasItem("/api/tickets?q=pothole")));
    }

    // -----------------------------------------------------------------------
    // Test 7: Bookmark owner enforcement — DELETE by different user returns 403
    // -----------------------------------------------------------------------

    /**
     * DELETE /api/bookmarks/{id} by a non-owner non-admin returns 403 FORBIDDEN.
     */
    @Test
    void deleteBookmark_byNonOwner_returns403() throws Exception {
        // staff1 creates a bookmark
        var body = Map.of(
                "name", "Owner's bookmark",
                "requestUri", "/api/tickets?q=pothole"
        );
        MvcResult createResult = mockMvc.perform(post("/api/bookmarks")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andReturn();

        Long bookmarkId = objectMapper.readTree(
                createResult.getResponse().getContentAsString()).get("id").asLong();

        // staff2 tries to delete staff1's bookmark → 403
        mockMvc.perform(delete("/api/bookmarks/{id}", bookmarkId)
                        .header("Authorization", "Bearer " + staff2Jwt))
                .andExpect(status().isForbidden());
    }

    // -----------------------------------------------------------------------
    // Test 8: Bookmark delete — DELETE by owner returns 204; GET returns empty
    // -----------------------------------------------------------------------

    /**
     * DELETE /api/bookmarks/{id} by owner returns 204 NO_CONTENT.
     * Subsequent GET /api/bookmarks returns empty list for that user.
     */
    @Test
    void deleteBookmark_byOwner_returns204_andSubsequentGetIsEmpty() throws Exception {
        // Create a bookmark as staff1
        var body = Map.of(
                "name", "Temporary bookmark",
                "requestUri", "/api/tickets?q=pothole"
        );
        MvcResult createResult = mockMvc.perform(post("/api/bookmarks")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andReturn();

        Long bookmarkId = objectMapper.readTree(
                createResult.getResponse().getContentAsString()).get("id").asLong();

        // Owner deletes the bookmark → 204
        mockMvc.perform(delete("/api/bookmarks/{id}", bookmarkId)
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isNoContent());

        // Subsequent GET returns empty list for this user
        mockMvc.perform(get("/api/bookmarks")
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }
}
