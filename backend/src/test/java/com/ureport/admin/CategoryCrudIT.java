package com.ureport.admin;

import com.fasterxml.jackson.databind.JsonNode;
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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for Category and CategoryGroup CRUD API (05-03).
 *
 * Uses native sidecar PostgreSQL (no Testcontainers — no Docker daemon in K8s sandbox).
 * DATABASE_URL is injected by the platform; application-test.properties uses real DB.
 *
 * Test cases:
 * 1. POST /api/categories with actionResponses → 201; GET/{id} has actionResponses
 * 2. PUT /api/categories/{id} remove one actionResponse → GET/{id} confirms removed
 * 3. DELETE /api/categories/{id} referenced by ticket → 409 CATEGORY_IN_USE
 * 4. GET /api/categories/public → no JWT required; returns only public/anonymous postable, active
 * 5. POST /api/categories with autoCloseIsActive=true, no autoCloseSubstatusId → 400
 * 6. POST /api/categories with postingPermissionLevel more restrictive than display → 400
 * 7. GET /api/categories/{id}/action-responses/{actionId} — present: category template; absent: fallback
 * 8. Category group CRUD: POST/PUT/DELETE; DELETE blocked when category in group → 409
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class CategoryCrudIT {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JwtUtil jwtUtil;

    @Autowired PersonRepository personRepository;
    @Autowired DepartmentRepository departmentRepository;
    @Autowired CategoryRepository categoryRepository;
    @Autowired CategoryGroupRepository categoryGroupRepository;
    @Autowired ActionsRepository actionsRepository;
    @Autowired SubstatusRepository substatusRepository;
    @Autowired TicketRepository ticketRepository;

    private String adminJwt;
    private Long seedDeptId;
    private Long seedActionId;

    @BeforeEach
    void setUp() {
        // Seed an admin person and generate JWT
        Person admin = new Person();
        admin.setFirstname("Admin");
        admin.setLastname("CatTest");
        admin.setUsername("admin_cat_" + System.nanoTime());
        admin.setEmail("admin_cat_" + System.nanoTime() + "@example.com");
        admin.setRole("admin");
        admin = personRepository.save(admin);
        adminJwt = jwtUtil.generateToken(new PersonDetails(admin));

        // Seed a Department for category FK
        Department dept = new Department();
        dept.setName("TestDept_" + System.nanoTime());
        dept = departmentRepository.save(dept);
        seedDeptId = dept.getId();

        // Seed an Action for actionResponse tests
        Action action = new Action();
        action.setName("TestAction_" + System.nanoTime());
        action.setType("department");
        action.setTemplate("Default template");
        action.setReplyEmail("default@example.com");
        action = actionsRepository.save(action);
        seedActionId = action.getId();
    }

    // -----------------------------------------------------------------------
    // Test 1: POST /api/categories with actionResponses → 201; GET/{id} reflects them
    // -----------------------------------------------------------------------
    @Test
    void createCategory_withActionResponses_returns201AndActionResponsesReflectedInGet() throws Exception {
        List<Map<String, Object>> actionResponses = List.of(
                Map.of("actionId", seedActionId, "template", "Custom template", "replyEmail", "custom@example.com")
        );

        Map<String, Object> body = new HashMap<>();
        body.put("name", "Roads " + System.nanoTime());
        body.put("departmentId", seedDeptId);
        body.put("actionResponses", actionResponses);

        String response = mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.actionResponses", hasSize(1)))
                .andExpect(jsonPath("$.actionResponses[0].actionId").value(seedActionId.intValue()))
                .andExpect(jsonPath("$.actionResponses[0].template").value("Custom template"))
                .andReturn().getResponse().getContentAsString();

        Long catId = objectMapper.readTree(response).get("id").asLong();

        // Verify GET/{id} also returns actionResponses
        mockMvc.perform(get("/api/categories/{id}", catId)
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.actionResponses", hasSize(1)))
                .andExpect(jsonPath("$.actionResponses[0].actionId").value(seedActionId.intValue()));
    }

    // -----------------------------------------------------------------------
    // Test 2: PUT removes one actionResponse; GET/{id} confirms removed
    // -----------------------------------------------------------------------
    @Test
    void updateCategory_removeActionResponse_reconciliationReflectedInGet() throws Exception {
        // Create with one actionResponse
        List<Map<String, Object>> actionResponses = List.of(
                Map.of("actionId", seedActionId, "template", "Template to remove", "replyEmail", "remove@example.com")
        );

        Map<String, Object> createBody = new HashMap<>();
        createBody.put("name", "ReconcileTest " + System.nanoTime());
        createBody.put("departmentId", seedDeptId);
        createBody.put("actionResponses", actionResponses);

        String createResponse = mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createBody)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.actionResponses", hasSize(1)))
                .andReturn().getResponse().getContentAsString();

        Long catId = objectMapper.readTree(createResponse).get("id").asLong();

        // Update with empty actionResponses list — should remove the association
        Map<String, Object> updateBody = new HashMap<>();
        updateBody.put("name", "ReconcileTest Updated " + System.nanoTime());
        updateBody.put("departmentId", seedDeptId);
        updateBody.put("actionResponses", new ArrayList<>());

        mockMvc.perform(put("/api/categories/{id}", catId)
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.actionResponses", hasSize(0)));

        // Verify GET also shows empty actionResponses
        mockMvc.perform(get("/api/categories/{id}", catId)
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.actionResponses", hasSize(0)));
    }

    // -----------------------------------------------------------------------
    // Test 3: DELETE referenced by ticket → 409 CATEGORY_IN_USE
    // -----------------------------------------------------------------------
    @Test
    void deleteCategory_referencedByTicket_returns409CategoryInUse() throws Exception {
        Long catId = createCategoryViaApi("InUse " + System.nanoTime());

        // Seed a ticket referencing this category
        Category cat = categoryRepository.findById(catId).orElseThrow();
        Ticket ticket = new Ticket();
        ticket.setCategory(cat);
        ticketRepository.save(ticket);

        mockMvc.perform(delete("/api/categories/{id}", catId)
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CATEGORY_IN_USE"));
    }

    // -----------------------------------------------------------------------
    // Test 4: GET /api/categories/public — no auth; returns only public/anonymous active categories
    // -----------------------------------------------------------------------
    @Test
    void getPublicCategories_noAuth_returnsOnlyPublicOrAnonymousActiveCategories() throws Exception {
        // Create a public-postable category (active=true, postingPermissionLevel=public)
        Map<String, Object> publicCatBody = new HashMap<>();
        publicCatBody.put("name", "PublicCat " + System.nanoTime());
        publicCatBody.put("departmentId", seedDeptId);
        publicCatBody.put("postingPermissionLevel", "public");
        publicCatBody.put("displayPermissionLevel", "public");
        publicCatBody.put("active", true);

        String pubCatResponse = mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(publicCatBody)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long publicCatId = objectMapper.readTree(pubCatResponse).get("id").asLong();

        // Create a staff-only category (should NOT appear in /public)
        Map<String, Object> staffCatBody = new HashMap<>();
        staffCatBody.put("name", "StaffCat " + System.nanoTime());
        staffCatBody.put("departmentId", seedDeptId);
        staffCatBody.put("postingPermissionLevel", "staff");
        staffCatBody.put("displayPermissionLevel", "staff");
        staffCatBody.put("active", true);

        String staffCatResponse = mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(staffCatBody)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long staffCatId = objectMapper.readTree(staffCatResponse).get("id").asLong();

        // GET /api/categories/public — NO auth header
        String publicResponse = mockMvc.perform(get("/api/categories/public"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andReturn().getResponse().getContentAsString();

        JsonNode results = objectMapper.readTree(publicResponse);
        assertTrue(results.isArray(), "Response should be array");

        // Find IDs in response
        List<Long> returnedIds = new ArrayList<>();
        for (JsonNode node : results) {
            returnedIds.add(node.get("id").asLong());
        }

        // Public category should be present
        assertTrue(returnedIds.contains(publicCatId),
                "Public category should appear in /public endpoint");
        // Staff category should NOT be present
        assertFalse(returnedIds.contains(staffCatId),
                "Staff-only category should NOT appear in /public endpoint");
    }

    // -----------------------------------------------------------------------
    // Test 5: autoCloseIsActive=true without autoCloseSubstatusId → 400
    // -----------------------------------------------------------------------
    @Test
    void createCategory_autoCloseActiveWithoutSubstatus_returns400() throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("name", "AutoClose " + System.nanoTime());
        body.put("departmentId", seedDeptId);
        body.put("autoCloseIsActive", true);
        // autoCloseSubstatusId intentionally omitted

        mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("AUTOCLOSE_SUBSTATUS_REQUIRED"));
    }

    // -----------------------------------------------------------------------
    // Test 6: postingPermissionLevel more restrictive than displayPermissionLevel → 400
    // -----------------------------------------------------------------------
    @Test
    void createCategory_postingMoreRestrictiveThanDisplay_returns400PermissionLevelInvalid() throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("name", "PermTest " + System.nanoTime());
        body.put("departmentId", seedDeptId);
        body.put("displayPermissionLevel", "public");
        body.put("postingPermissionLevel", "staff");  // staff(2) > public(1) → invalid

        mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PERMISSION_LEVEL_INVALID"));
    }

    // -----------------------------------------------------------------------
    // Test 7: GET action-response — present returns category template; absent falls back
    // -----------------------------------------------------------------------
    @Test
    void getActionResponse_present_returnsCategoryTemplate_absent_fallsBackToActionTemplate() throws Exception {
        // Create category with one action response override
        List<Map<String, Object>> actionResponses = List.of(
                Map.of("actionId", seedActionId, "template", "Category-specific template", "replyEmail", "cat@example.com")
        );

        Map<String, Object> body = new HashMap<>();
        body.put("name", "ActionRespTest " + System.nanoTime());
        body.put("departmentId", seedDeptId);
        body.put("actionResponses", actionResponses);

        String createResponse = mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long catId = objectMapper.readTree(createResponse).get("id").asLong();

        // Request the action response — should return category-specific template
        mockMvc.perform(get("/api/categories/{id}/action-responses/{actionId}", catId, seedActionId)
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.template").value("Category-specific template"))
                .andExpect(jsonPath("$.actionId").value(seedActionId.intValue()));

        // Seed another action without category override
        Action anotherAction = new Action();
        anotherAction.setName("AnotherAction_" + System.nanoTime());
        anotherAction.setType("department");
        anotherAction.setTemplate("Fallback template");
        anotherAction.setReplyEmail("fallback@example.com");
        anotherAction = actionsRepository.save(anotherAction);
        Long anotherActionId = anotherAction.getId();

        // Request action-response for action with no override → fallback to action.template
        mockMvc.perform(get("/api/categories/{id}/action-responses/{actionId}", catId, anotherActionId)
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.template").value("Fallback template"))
                .andExpect(jsonPath("$.actionId").value(anotherActionId.intValue()));
    }

    // -----------------------------------------------------------------------
    // Test 8: Category group CRUD; DELETE blocked if category in group
    // -----------------------------------------------------------------------
    @Test
    void categoryGroupCrud_deleteBlockedWhenCategoryInGroup() throws Exception {
        // Create a category group
        Map<String, Object> groupBody = Map.of("name", "TestGroup " + System.nanoTime(), "ordering", 1);

        String groupResponse = mockMvc.perform(post("/api/category-groups")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(groupBody)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").isString())
                .andReturn().getResponse().getContentAsString();

        Long groupId = objectMapper.readTree(groupResponse).get("id").asLong();

        // Update the group name
        Map<String, Object> updateGroupBody = Map.of("name", "UpdatedGroup " + System.nanoTime(), "ordering", 2);
        mockMvc.perform(put("/api/category-groups/{id}", groupId)
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateGroupBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(groupId.intValue()));

        // Create a category in this group
        Map<String, Object> catBody = new HashMap<>();
        catBody.put("name", "CatInGroup " + System.nanoTime());
        catBody.put("departmentId", seedDeptId);
        catBody.put("categoryGroupId", groupId);

        mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(catBody)))
                .andExpect(status().isCreated());

        // Try to delete the group — should be blocked (409)
        mockMvc.perform(delete("/api/category-groups/{id}", groupId)
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CATEGORY_GROUP_IN_USE"));

        // Verify we can delete a group with no categories
        Map<String, Object> emptyGroupBody = Map.of("name", "EmptyGroup " + System.nanoTime(), "ordering", 3);
        String emptyGroupResponse = mockMvc.perform(post("/api/category-groups")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(emptyGroupBody)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long emptyGroupId = objectMapper.readTree(emptyGroupResponse).get("id").asLong();
        mockMvc.perform(delete("/api/category-groups/{id}", emptyGroupId)
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isNoContent());
    }

    // -----------------------------------------------------------------------
    // Helper: create category via POST, return its id
    // -----------------------------------------------------------------------
    private Long createCategoryViaApi(String name) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("name", name);
        body.put("departmentId", seedDeptId);

        String response = mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("id").asLong();
    }
}
