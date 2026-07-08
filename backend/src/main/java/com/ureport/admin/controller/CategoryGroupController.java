package com.ureport.admin.controller;

import com.ureport.admin.dto.CategoryGroupDto;
import com.ureport.admin.service.CategoryGroupService;
import com.ureport.admin.service.CategoryGroupService.CreateCategoryGroupRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for CategoryGroup management API.
 *
 * Endpoints:
 * GET    /api/category-groups        → 200 List<CategoryGroupDto>  (JWT required)
 * POST   /api/category-groups        → 201 CategoryGroupDto        (ADMIN only)
 * PUT    /api/category-groups/{id}   → 200 CategoryGroupDto        (ADMIN only)
 * DELETE /api/category-groups/{id}   → 204                         (ADMIN only)
 */
@RestController
@RequestMapping("/api/category-groups")
public class CategoryGroupController {

    private final CategoryGroupService categoryGroupService;

    public CategoryGroupController(CategoryGroupService categoryGroupService) {
        this.categoryGroupService = categoryGroupService;
    }

    /**
     * GET /api/category-groups — list all category groups.
     * Requires JWT (any authenticated role).
     */
    @GetMapping
    public ResponseEntity<List<CategoryGroupDto>> listGroups() {
        return ResponseEntity.ok(categoryGroupService.listCategoryGroups());
    }

    /**
     * POST /api/category-groups — create a new category group.
     * Requires ADMIN role.
     * Returns HTTP 201 with the created CategoryGroupDto.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoryGroupDto> createGroup(
            @RequestBody CreateCategoryGroupRequest req) {
        return ResponseEntity.status(201).body(categoryGroupService.createGroup(req));
    }

    /**
     * PUT /api/category-groups/{id} — update a category group.
     * Requires ADMIN role.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoryGroupDto> updateGroup(
            @PathVariable Long id,
            @RequestBody CreateCategoryGroupRequest req) {
        return ResponseEntity.ok(categoryGroupService.updateGroup(id, req));
    }

    /**
     * DELETE /api/category-groups/{id} — delete a category group.
     * Returns 409 CONFLICT if any category references this group.
     * Requires ADMIN role.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteGroup(@PathVariable Long id) {
        categoryGroupService.deleteGroup(id);
        return ResponseEntity.noContent().build();
    }
}
