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

import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for Department CRUD API (05-02).
 *
 * Uses native sidecar PostgreSQL (no Testcontainers — no Docker daemon in K8s sandbox).
 * DATABASE_URL is injected by the platform; application-test.properties uses real DB.
 *
 * Test cases:
 * 1. POST /api/departments with {name, actionIds:[seedActionId]} → 201; GET/{id} has actionIds
 * 2. PUT /api/departments/{id} removing one actionId → GET/{id} confirms action removed
 * 3. DELETE /api/departments/{id} with category referencing it → 409 DEPT_IN_USE
 * 4. DELETE /api/departments/{id} with no categories → 204; GET/{id} → 404
 * 5. POST /api/departments with name > 128 chars → 400
 * 6. GET /api/departments/{id}/categories returns categories for that dept
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DepartmentCrudIT {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JwtUtil jwtUtil;

    @Autowired PersonRepository personRepository;
    @Autowired DepartmentRepository departmentRepository;
    @Autowired DepartmentActionRepository departmentActionRepository;
    @Autowired CategoryRepository categoryRepository;
    @Autowired ActionsRepository actionsRepository;

    private String adminJwt;
    private Long seedActionId;

    @BeforeEach
    void setUp() {
        // Seed an admin person and generate JWT
        Person admin = new Person();
        admin.setFirstname("Admin");
        admin.setLastname("DeptTest");
        admin.setUsername("admin_dept_" + System.nanoTime());
        admin.setEmail("admin_dept_" + System.nanoTime() + "@example.com");
        admin.setRole("admin");
        admin = personRepository.save(admin);
        adminJwt = jwtUtil.generateToken(new PersonDetails(admin));

        // Seed an Action for association tests
        Action action = new Action();
        action.setName("TestAction_" + System.nanoTime());
        action.setType("department");
        action = actionsRepository.save(action);
        seedActionId = action.getId();
    }

    // -----------------------------------------------------------------------
    // Test 1: POST creates department with actionIds; GET/{id} reflects them
    // -----------------------------------------------------------------------
    @Test
    void createDepartment_withActionIds_returns201AndActionIdsReflectedInGet() throws Exception {
        var body = Map.of(
                "name", "Public Works " + System.nanoTime(),
                "actionIds", List.of(seedActionId)
        );

        String response = mockMvc.perform(post("/api/departments")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.actionIds", hasItem(seedActionId.intValue())))
                .andReturn().getResponse().getContentAsString();

        Long deptId = objectMapper.readTree(response).get("id").asLong();

        // Verify GET/{id} also returns the actionId
        mockMvc.perform(get("/api/departments/{id}", deptId)
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(deptId))
                .andExpect(jsonPath("$.actionIds", hasItem(seedActionId.intValue())));
    }

    // -----------------------------------------------------------------------
    // Test 2: PUT reconciles actionIds — removing an action is reflected in GET
    // -----------------------------------------------------------------------
    @Test
    void updateDepartment_removeActionId_reconciliationReflectedInGet() throws Exception {
        // Create department with one actionId
        Long deptId = createDeptViaApi("ReconcileTest_" + System.nanoTime(), List.of(seedActionId));

        // Update with empty actionIds list — should remove the association
        var updateBody = Map.of(
                "name", "ReconcileTest_Updated",
                "actionIds", List.of()
        );

        mockMvc.perform(put("/api/departments/{id}", deptId)
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.actionIds", hasSize(0)));

        // Verify GET also shows empty actionIds
        mockMvc.perform(get("/api/departments/{id}", deptId)
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.actionIds", hasSize(0)));
    }

    // -----------------------------------------------------------------------
    // Test 3: DELETE with category referencing dept → 409 DEPT_IN_USE
    // -----------------------------------------------------------------------
    @Test
    void deleteDepartment_withCategory_returns409DeptInUse() throws Exception {
        Long deptId = createDeptViaApi("InUse_" + System.nanoTime(), List.of());

        // Seed a category referencing this department
        Department dept = departmentRepository.findById(deptId).orElseThrow();
        Category cat = new Category();
        cat.setName("TestCat_" + System.nanoTime());
        cat.setDepartment(dept);
        cat.setActive(true);
        categoryRepository.save(cat);

        mockMvc.perform(delete("/api/departments/{id}", deptId)
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DEPT_IN_USE"));
    }

    // -----------------------------------------------------------------------
    // Test 4: DELETE unreferenced dept → 204; GET → 404
    // -----------------------------------------------------------------------
    @Test
    void deleteDepartment_noCategories_returns204AndGetReturns404() throws Exception {
        Long deptId = createDeptViaApi("ForDelete_" + System.nanoTime(), List.of());

        mockMvc.perform(delete("/api/departments/{id}", deptId)
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isNoContent());

        // Verify GET returns 404
        mockMvc.perform(get("/api/departments/{id}", deptId)
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isNotFound());
    }

    // -----------------------------------------------------------------------
    // Test 5: POST with name > 128 chars → 400
    // -----------------------------------------------------------------------
    @Test
    void createDepartment_nameTooLong_returns400() throws Exception {
        String longName = "A".repeat(129);
        var body = Map.of("name", longName);

        mockMvc.perform(post("/api/departments")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
    }

    // -----------------------------------------------------------------------
    // Test 6: GET /api/departments/{id}/categories returns dept's categories
    // -----------------------------------------------------------------------
    @Test
    void getDepartmentCategories_returnsCategoriesForDept() throws Exception {
        Long deptId = createDeptViaApi("CatList_" + System.nanoTime(), List.of());

        // Seed two categories for this department
        Department dept = departmentRepository.findById(deptId).orElseThrow();
        Category cat1 = new Category();
        cat1.setName("CatA_" + System.nanoTime());
        cat1.setDepartment(dept);
        cat1.setActive(true);
        categoryRepository.save(cat1);

        Category cat2 = new Category();
        cat2.setName("CatB_" + System.nanoTime());
        cat2.setDepartment(dept);
        cat2.setActive(false);
        categoryRepository.save(cat2);

        String response = mockMvc.perform(get("/api/departments/{id}/categories", deptId)
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(2))))
                .andReturn().getResponse().getContentAsString();

        // Verify each entry has id, name, and active fields
        JsonNode cats = objectMapper.readTree(response);
        assertTrue(cats.isArray());
        for (JsonNode cat : cats) {
            assertTrue(cat.has("id"), "category should have id");
            assertTrue(cat.has("name"), "category should have name");
            assertTrue(cat.has("active"), "category should have active flag");
        }
    }

    // -----------------------------------------------------------------------
    // Helper: create department via POST, return its id
    // -----------------------------------------------------------------------
    private Long createDeptViaApi(String name, List<Long> actionIds) throws Exception {
        var body = Map.of(
                "name", name,
                "actionIds", actionIds
        );

        String response = mockMvc.perform(post("/api/departments")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("id").asLong();
    }
}
