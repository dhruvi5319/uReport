package com.ureport.admin;

import com.fasterxml.jackson.databind.JsonNode;
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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for the People management CRUD API (F6 / 05-01).
 *
 * Uses Zonky embedded PostgreSQL — works in all environments (Daytona and native-sidecar).
 * @AutoConfigureEmbeddedDatabase replaces the DataSource with an in-process PostgreSQL.
 *
 * Test cases:
 * 1. POST /api/people with emails + phones → 201; GET /{id} has emails[0].email
 * 2. PUT /api/people/{id} removing one email → GET /{id} confirms email removed
 * 3. POST with duplicate username → 409 USERNAME_CONFLICT
 * 4. DELETE /{id} person referenced by ticket → 409 PERSON_IN_USE
 * 5. DELETE /{id} unreferenced person → 204; GET /{id} → 404
 * 6. GET /api/people?q=john → returns paginated shape {data, total, page, pageSize}
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@AutoConfigureEmbeddedDatabase(
    provider = AutoConfigureEmbeddedDatabase.DatabaseProvider.ZONKY,
    type = AutoConfigureEmbeddedDatabase.DatabaseType.POSTGRES
)
@Transactional
class PeopleCrudIT {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JwtUtil jwtUtil;

    @Autowired PersonRepository personRepository;
    @Autowired TicketRepository ticketRepository;
    @Autowired CategoryRepository categoryRepository;
    @Autowired DepartmentRepository departmentRepository;
    @Autowired ActionsRepository actionsRepository;
    @Autowired TicketHistoryRepository ticketHistoryRepository;

    private String adminJwt;
    private String staffJwt;

    @BeforeEach
    void setUp() {
        // Seed admin person for write operations
        Person admin = new Person();
        admin.setFirstname("Admin");
        admin.setLastname("PeopleTest");
        admin.setUsername("admin_people_" + System.nanoTime());
        admin.setEmail("admin_people_" + System.nanoTime() + "@example.com");
        admin.setRole("admin");
        admin = personRepository.save(admin);
        adminJwt = jwtUtil.generateToken(new PersonDetails(admin));

        // Seed staff person for testing 403 on role assignment
        Person staff = new Person();
        staff.setFirstname("Staff");
        staff.setLastname("PeopleTest");
        staff.setUsername("staff_people_" + System.nanoTime());
        staff.setEmail("staff_people_" + System.nanoTime() + "@example.com");
        staff.setRole("staff");
        staff = personRepository.save(staff);
        staffJwt = jwtUtil.generateToken(new PersonDetails(staff));
    }

    // -----------------------------------------------------------------------
    // Test 1: POST creates person with emails/phones → 201; GET/{id} has them
    // -----------------------------------------------------------------------
    @Test
    void createPerson_withEmailAndPhone_returns201WithNestedData() throws Exception {
        var body = Map.of(
                "firstname", "John",
                "lastname", "Doe",
                "emails", List.of(Map.of(
                        "email", "john.doe@example.com",
                        "label", "Work",
                        "usedForNotifications", true
                )),
                "phones", List.of(Map.of(
                        "number", "555-0100",
                        "label", "Mobile"
                ))
        );

        String response = mockMvc.perform(post("/api/people")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.firstname").value("John"))
                .andExpect(jsonPath("$.emails").isArray())
                .andExpect(jsonPath("$.emails", hasSize(1)))
                .andExpect(jsonPath("$.emails[0].email").value("john.doe@example.com"))
                .andExpect(jsonPath("$.phones").isArray())
                .andExpect(jsonPath("$.phones", hasSize(1)))
                .andExpect(jsonPath("$.phones[0].number").value("555-0100"))
                .andReturn().getResponse().getContentAsString();

        Long personId = objectMapper.readTree(response).get("id").asLong();

        // Verify GET /{id} also returns the nested data
        mockMvc.perform(get("/api/people/{id}", personId)
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emails[0].email").value("john.doe@example.com"))
                .andExpect(jsonPath("$.phones[0].number").value("555-0100"));
    }

    // -----------------------------------------------------------------------
    // Test 2: PUT removes one email from array → GET confirms email deleted
    // -----------------------------------------------------------------------
    @Test
    void updatePerson_removingEmail_confirmsEmailDeletedOnGet() throws Exception {
        // Create person with 2 emails
        var createBody = Map.of(
                "firstname", "Jane",
                "lastname", "Smith",
                "emails", List.of(
                        Map.of("email", "jane.keep@example.com", "label", "Work", "usedForNotifications", false),
                        Map.of("email", "jane.remove@example.com", "label", "Home", "usedForNotifications", false)
                )
        );

        String createResponse = mockMvc.perform(post("/api/people")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createBody)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        JsonNode created = objectMapper.readTree(createResponse);
        Long personId = created.get("id").asLong();

        // Find the ID of the email to keep
        JsonNode emails = created.get("emails");
        Long keepEmailId = null;
        for (JsonNode email : emails) {
            if ("jane.keep@example.com".equals(email.get("email").asText())) {
                keepEmailId = email.get("id").asLong();
                break;
            }
        }
        assertNotNull(keepEmailId, "Should find the email to keep");

        // PUT with only the email to keep (removes the other)
        var updateBody = Map.of(
                "firstname", "Jane",
                "lastname", "Smith",
                "emails", List.of(
                        Map.of("id", keepEmailId, "email", "jane.keep@example.com",
                                "label", "Work", "usedForNotifications", false)
                )
        );

        mockMvc.perform(put("/api/people/{id}", personId)
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emails", hasSize(1)))
                .andExpect(jsonPath("$.emails[0].email").value("jane.keep@example.com"));

        // GET confirms only 1 email remains
        mockMvc.perform(get("/api/people/{id}", personId)
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emails", hasSize(1)))
                .andExpect(jsonPath("$.emails[0].email").value("jane.keep@example.com"));
    }

    // -----------------------------------------------------------------------
    // Test 3: POST with duplicate username → 409 USERNAME_CONFLICT
    // -----------------------------------------------------------------------
    @Test
    void createPerson_duplicateUsername_returns409Conflict() throws Exception {
        // Create person with a username
        String uniqueUsername = "testuser_" + System.nanoTime();
        var body1 = Map.of(
                "firstname", "First",
                "lastname", "Person",
                "username", uniqueUsername
        );

        mockMvc.perform(post("/api/people")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body1)))
                .andExpect(status().isCreated());

        // Try to create another with the same username
        var body2 = Map.of(
                "firstname", "Second",
                "lastname", "Person",
                "username", uniqueUsername
        );

        mockMvc.perform(post("/api/people")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body2)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("USERNAME_CONFLICT"));
    }

    // -----------------------------------------------------------------------
    // Test 4: DELETE /{id} person referenced by ticket → 409 PERSON_IN_USE
    // -----------------------------------------------------------------------
    @Test
    void deletePerson_referencedByTicket_returns409Conflict() throws Exception {
        // Create a department and category for the ticket
        Department dept = new Department();
        dept.setName("TestDept_" + System.nanoTime());
        dept = departmentRepository.save(dept);

        Category cat = new Category();
        cat.setName("TestCat_" + System.nanoTime());
        cat.setDepartment(dept);
        cat.setActive(true);
        cat.setDisplayPermissionLevel("staff");
        cat.setPostingPermissionLevel("staff");
        cat.setLastModified(LocalDateTime.now());
        cat = categoryRepository.save(cat);

        // Create a person to be referenced
        Person refPerson = new Person();
        refPerson.setFirstname("Referenced");
        refPerson.setLastname("Person");
        refPerson.setUsername("ref_person_" + System.nanoTime());
        refPerson.setEmail("ref_" + System.nanoTime() + "@example.com");
        refPerson.setRole("staff");
        refPerson = personRepository.save(refPerson);

        // Seed an admin to enter the ticket
        Person enteredByAdmin = new Person();
        enteredByAdmin.setFirstname("TicketAdmin");
        enteredByAdmin.setLastname("Seeder");
        enteredByAdmin.setUsername("ticket_admin_" + System.nanoTime());
        enteredByAdmin.setEmail("ticket_admin_" + System.nanoTime() + "@example.com");
        enteredByAdmin.setRole("admin");
        enteredByAdmin = personRepository.save(enteredByAdmin);

        // Create a ticket referencing the person as assignedPerson
        Ticket ticket = new Ticket();
        ticket.setCategory(cat);
        ticket.setStatus("open");
        ticket.setDescription("Test ticket for delete safety");
        ticket.setEnteredDate(LocalDateTime.now());
        ticket.setLastModified(LocalDateTime.now());
        ticket.setAssignedPerson(refPerson);
        ticket.setEnteredByPerson(enteredByAdmin);
        ticketRepository.save(ticket);

        // Try to delete the referenced person
        Long refPersonId = refPerson.getId();
        mockMvc.perform(delete("/api/people/{id}", refPersonId)
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PERSON_IN_USE"));
    }

    // -----------------------------------------------------------------------
    // Test 5: DELETE /{id} unreferenced person → 204; GET /{id} → 404
    // -----------------------------------------------------------------------
    @Test
    void deletePerson_unreferenced_returns204AndGetReturns404() throws Exception {
        // Create a person with no ticket references
        var body = Map.of(
                "firstname", "ToDelete",
                "lastname", "Person"
        );

        String response = mockMvc.perform(post("/api/people")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long personId = objectMapper.readTree(response).get("id").asLong();

        // Delete the person
        mockMvc.perform(delete("/api/people/{id}", personId)
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isNoContent());

        // GET should return 404
        mockMvc.perform(get("/api/people/{id}", personId)
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isNotFound());
    }

    // -----------------------------------------------------------------------
    // Test 6: GET /api/people?q=john → paginated shape {data, total, page, pageSize}
    // -----------------------------------------------------------------------
    @Test
    void listPeople_withSearchQuery_returnsPaginatedShape() throws Exception {
        // Create a person named "John" to appear in search
        String uniqueName = "John_" + System.nanoTime();
        var body = Map.of(
                "firstname", uniqueName,
                "lastname", "TestSearch"
        );

        mockMvc.perform(post("/api/people")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated());

        // Search for "John"
        mockMvc.perform(get("/api/people")
                        .header("Authorization", "Bearer " + adminJwt)
                        .param("q", uniqueName)
                        .param("page", "0")
                        .param("page_size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.total").isNumber())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.pageSize").value(10))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));
    }
}
