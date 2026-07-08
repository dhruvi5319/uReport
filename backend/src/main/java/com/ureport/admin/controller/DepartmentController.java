package com.ureport.admin.controller;

import com.ureport.admin.dto.CreateDepartmentRequest;
import com.ureport.admin.dto.DepartmentDetailDto;
import com.ureport.admin.dto.UpdateDepartmentRequest;
import com.ureport.admin.service.DepartmentService;
import com.ureport.admin.service.DepartmentService.CategoryRef;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Department management API (F7).
 *
 * Endpoints per TechArch API spec:
 * GET    /api/departments          → 200 List<DepartmentDetailDto>  (JWT required, any role)
 * POST   /api/departments          → 201 DepartmentDetailDto        (ADMIN only)
 * GET    /api/departments/{id}     → 200 DepartmentDetailDto        (JWT required, any role)
 * PUT    /api/departments/{id}     → 200 DepartmentDetailDto        (ADMIN only)
 * DELETE /api/departments/{id}     → 204                            (ADMIN only)
 * GET    /api/departments/{id}/categories → 200 List<CategoryRef>   (JWT required, any role)
 *
 * Security (T-05-07): @PreAuthorize("hasRole('ADMIN')") on all write endpoints.
 * SecurityConfig also gates /api/departments/** to ADMIN or STAFF; method-level security
 * runs as a second enforcement layer for write methods.
 */
@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    /**
     * GET /api/departments — list all departments, ordered by name.
     * Requires JWT (any authenticated role).
     */
    @GetMapping
    public ResponseEntity<List<DepartmentDetailDto>> listDepartments() {
        return ResponseEntity.ok(departmentService.listDepartments());
    }

    /**
     * POST /api/departments — create a new department.
     * Requires ADMIN role (T-05-07).
     * Returns HTTP 201 with the created DepartmentDetailDto.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DepartmentDetailDto> createDepartment(
            @Valid @RequestBody CreateDepartmentRequest req) {
        return ResponseEntity.status(201).body(departmentService.createDepartment(req));
    }

    /**
     * GET /api/departments/{id} — get a single department by ID.
     * Requires JWT (any authenticated role).
     */
    @GetMapping("/{id}")
    public ResponseEntity<DepartmentDetailDto> getDepartment(@PathVariable Long id) {
        return ResponseEntity.ok(departmentService.getDepartment(id));
    }

    /**
     * PUT /api/departments/{id} — replace department fields and reconcile actionIds.
     * Requires ADMIN role (T-05-07).
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DepartmentDetailDto> updateDepartment(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDepartmentRequest req) {
        return ResponseEntity.ok(departmentService.updateDepartment(id, req));
    }

    /**
     * DELETE /api/departments/{id} — delete a department.
     * Returns 409 CONFLICT if any category references this department (T-05-09).
     * Requires ADMIN role (T-05-07).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteDepartment(@PathVariable Long id) {
        departmentService.deleteDepartment(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/departments/{id}/categories — list categories for this department.
     * Requires JWT (any authenticated role).
     */
    @GetMapping("/{id}/categories")
    public ResponseEntity<List<CategoryRef>> getDepartmentCategories(@PathVariable Long id) {
        return ResponseEntity.ok(departmentService.getDepartmentCategories(id));
    }
}
