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

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for the Open311 client CRUD API.
 *
 * Uses native sidecar PostgreSQL (no Testcontainers — no Docker daemon in K8s sandbox).
 * DATABASE_URL is injected by the platform; application-test.properties points Flyway
 * at the real database.
 *
 * Test cases:
 * 1. POST /api/clients (admin) → 201 with valid UUID apiKey; DB row created
 * 2. GET /api/clients (admin) → 200 list; apiKey is null in list response
 * 3. GET /api/clients/{id} (admin) → 200; apiKey is null (masked)
 * 4. PUT /api/clients/{id} name change → 200; DB name updated; api_key in DB unchanged
 * 5. DELETE /api/clients/{id} (admin) → 204; DB row deleted
 * 6. POST /api/clients (staff) → 403 (admin only)
 * 7. GET /api/clients without JWT → 401
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ClientCrudIT {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JwtUtil jwtUtil;

    @Autowired PersonRepository personRepository;
    @Autowired ClientRepository clientRepository;
    @Autowired ContactMethodRepository contactMethodRepository;

    private String adminJwt;
    private String staffJwt;
    private Long contactPersonId;

    // UUID pattern for api_key validation
    private static final String UUID_REGEX =
            "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

    @BeforeEach
    void setUp() {
        // Seed an admin person
        Person admin = new Person();
        admin.setFirstname("Admin");
        admin.setLastname("User");
        admin.setUsername("admin_" + System.nanoTime());
        admin.setEmail("admin_" + System.nanoTime() + "@example.com");
        admin.setRole("admin");
        admin = personRepository.save(admin);
        adminJwt = jwtUtil.generateToken(new PersonDetails(admin));
        contactPersonId = admin.getId();

        // Seed a staff person (should be denied access to /api/clients)
        Person staff = new Person();
        staff.setFirstname("Staff");
        staff.setLastname("User");
        staff.setUsername("staff_client_" + System.nanoTime());
        staff.setEmail("staff_client_" + System.nanoTime() + "@example.com");
        staff.setRole("staff");
        staff = personRepository.save(staff);
        staffJwt = jwtUtil.generateToken(new PersonDetails(staff));
    }

    // -----------------------------------------------------------------------
    // Test 1: POST /api/clients (admin) → 201 with UUID apiKey
    // -----------------------------------------------------------------------
    @Test
    void createClient_withAdminJwt_returns201WithUuidApiKey() throws Exception {
        var body = Map.of(
                "name", "Test Client " + System.nanoTime(),
                "contactPersonId", contactPersonId
        );

        String response = mockMvc.perform(post("/api/clients")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.apiKey").value(matchesRegex(UUID_REGEX)))
                .andExpect(jsonPath("$.contactPerson.id").value(contactPersonId))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long clientId = objectMapper.readTree(response).get("id").asLong();
        String apiKey = objectMapper.readTree(response).get("apiKey").asText();

        // Verify DB row created with correct api_key
        Optional<Client> saved = clientRepository.findById(clientId);
        assertTrue(saved.isPresent(), "Client should be saved in DB");
        assertEquals(apiKey, saved.get().getApiKey(),
                "api_key in DB should match the returned apiKey");
    }

    // -----------------------------------------------------------------------
    // Test 2: GET /api/clients (admin) → 200, apiKey is null in list
    // -----------------------------------------------------------------------
    @Test
    void listClients_withAdminJwt_returns200WithMaskedApiKey() throws Exception {
        // Create a client first
        createClientViaApi("ListTest_" + System.nanoTime());

        mockMvc.perform(get("/api/clients")
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[*].apiKey", everyItem(nullValue())));
    }

    // -----------------------------------------------------------------------
    // Test 3: GET /api/clients/{id} (admin) → 200, apiKey masked
    // -----------------------------------------------------------------------
    @Test
    void getClient_withAdminJwt_returns200WithMaskedApiKey() throws Exception {
        Long clientId = createClientViaApi("GetTest_" + System.nanoTime());

        mockMvc.perform(get("/api/clients/{id}", clientId)
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(clientId))
                .andExpect(jsonPath("$.apiKey").value(nullValue()));
    }

    // -----------------------------------------------------------------------
    // Test 4: PUT /api/clients/{id} — name changes, api_key unchanged in DB
    // -----------------------------------------------------------------------
    @Test
    void updateClient_nameChange_apiKeyPreservedInDb() throws Exception {
        // Create client and capture its api_key
        Long clientId = createClientViaApi("UpdateTest_" + System.nanoTime());
        String originalApiKey = clientRepository.findById(clientId)
                .map(Client::getApiKey)
                .orElseThrow(() -> new IllegalStateException("Client not found"));

        String newName = "Updated Client Name " + System.nanoTime();
        var updateBody = Map.of("name", newName);

        mockMvc.perform(put("/api/clients/{id}", clientId)
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value(newName))
                .andExpect(jsonPath("$.apiKey").value(nullValue())); // masked on update

        // Verify: DB name updated, api_key unchanged
        Client reloaded = clientRepository.findById(clientId).orElseThrow();
        assertEquals(newName, reloaded.getName(), "Client name should be updated in DB");
        assertEquals(originalApiKey, reloaded.getApiKey(),
                "api_key in DB should be unchanged after name update");
    }

    // -----------------------------------------------------------------------
    // Test 5: DELETE /api/clients/{id} (admin) → 204; DB row deleted
    // -----------------------------------------------------------------------
    @Test
    void deleteClient_withAdminJwt_returns204AndRemovesDbRow() throws Exception {
        Long clientId = createClientViaApi("DeleteTest_" + System.nanoTime());

        mockMvc.perform(delete("/api/clients/{id}", clientId)
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isNoContent());

        assertFalse(clientRepository.existsById(clientId),
                "Client DB row should be deleted");
    }

    // -----------------------------------------------------------------------
    // Test 6: POST /api/clients (staff) → 403
    // -----------------------------------------------------------------------
    @Test
    void createClient_withStaffJwt_returns403() throws Exception {
        var body = Map.of(
                "name", "StaffAttempt_" + System.nanoTime(),
                "contactPersonId", contactPersonId
        );

        mockMvc.perform(post("/api/clients")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isForbidden());
    }

    // -----------------------------------------------------------------------
    // Test 7: GET /api/clients without JWT → 401
    // -----------------------------------------------------------------------
    @Test
    void listClients_noJwt_returns401() throws Exception {
        mockMvc.perform(get("/api/clients"))
                .andExpect(status().isUnauthorized());
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    /**
     * Creates a client via POST /api/clients with admin JWT and returns its ID.
     */
    private Long createClientViaApi(String name) throws Exception {
        var body = Map.of(
                "name", name,
                "contactPersonId", contactPersonId
        );

        String response = mockMvc.perform(post("/api/clients")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get("id").asLong();
    }
}
