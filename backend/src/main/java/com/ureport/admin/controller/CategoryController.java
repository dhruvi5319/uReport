package com.ureport.admin.controller;

import com.ureport.admin.dto.*;
import com.ureport.admin.service.CategoryService;
import com.ureport.domain.Category;
import com.ureport.repository.CategoryRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * REST controller for Category management API (F8).
 *
 * Endpoints:
 * GET    /api/categories                           → 200 List<CategoryListItemDto>  (JWT required)
 * GET    /api/categories/public                    → 200 List<CategoryListItemDto>  (no auth — permitAll)
 * POST   /api/categories                           → 201 CategoryDetailDto          (ADMIN only)
 * GET    /api/categories/{id}                      → 200 CategoryDetailDto          (JWT required)
 * PUT    /api/categories/{id}                      → 200 CategoryDetailDto          (ADMIN only)
 * DELETE /api/categories/{id}                      → 204                            (ADMIN only)
 * GET    /api/categories/{id}/action-responses/{actionId} → 200 CategoryActionResponseDto (JWT required)
 *
 * Security: T-05-12, T-05-13 (see threat model in 05-03-PLAN.md)
 */
@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;
    private final CategoryRepository categoryRepository;

    public CategoryController(CategoryService categoryService,
                               CategoryRepository categoryRepository) {
        this.categoryService = categoryService;
        this.categoryRepository = categoryRepository;
    }

    /**
     * GET /api/categories — list categories with optional filters.
     * Requires JWT (any authenticated role).
     */
    @GetMapping
    public ResponseEntity<List<CategoryListItemDto>> listCategories(
            @RequestParam(name = "group_id", required = false) Long groupId,
            @RequestParam(name = "department_id", required = false) Long departmentId,
            @RequestParam(required = false) Boolean active) {
        return ResponseEntity.ok(categoryService.listCategories(groupId, departmentId, active));
    }

    /**
     * GET /api/categories/public — unauthenticated endpoint returning only active categories
     * with postingPermissionLevel of "public" or "anonymous" (T-05-13).
     *
     * NOTE: This method MUST be declared BEFORE /{id} to ensure Spring MVC resolves
     * the literal path "public" before the path variable {id}.
     */
    @GetMapping("/public")
    public ResponseEntity<List<CategoryListItemDto>> getPublicCategories() {
        List<Category> cats = categoryRepository.findByPostingPermissionLevelInAndActiveTrue(
                List.of("public", "anonymous"));
        List<CategoryListItemDto> result = cats.stream()
                .map(categoryService::toListItemDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/categories — create a new category.
     * Requires ADMIN role (T-05-12).
     * Returns HTTP 201 with the created CategoryDetailDto.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoryDetailDto> createCategory(
            @Valid @RequestBody CreateCategoryRequest req) {
        return ResponseEntity.status(201).body(categoryService.createCategory(req));
    }

    /**
     * GET /api/categories/{id} — get a single category by ID.
     * Requires JWT (any authenticated role).
     */
    @GetMapping("/{id}")
    public ResponseEntity<CategoryDetailDto> getCategory(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.getCategory(id));
    }

    /**
     * PUT /api/categories/{id} — replace category fields and reconcile actionResponses.
     * Requires ADMIN role (T-05-12).
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoryDetailDto> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCategoryRequest req) {
        return ResponseEntity.ok(categoryService.updateCategory(id, req));
    }

    /**
     * DELETE /api/categories/{id} — delete a category.
     * Returns 409 CONFLICT if any ticket references this category.
     * Requires ADMIN role (T-05-12).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/categories/{id}/action-responses/{actionId} — get action response template.
     * Returns category-specific template if set, falls back to action.template (T-05-16).
     * Requires JWT (any authenticated role).
     */
    @GetMapping("/{id}/action-responses/{actionId}")
    public ResponseEntity<CategoryActionResponseDto> getActionResponse(
            @PathVariable Long id,
            @PathVariable Long actionId) {
        return ResponseEntity.ok(categoryService.getActionResponse(id, actionId));
    }
}
