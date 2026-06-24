package com.ureport.controller;

import com.ureport.dto.request.CategoryActionResponseRequest;
import com.ureport.dto.request.CreateCategoryRequest;
import com.ureport.dto.response.CategoryResponse;
import com.ureport.security.JwtUserDetails;
import com.ureport.service.CategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    /**
     * List categories — filtered by caller's role (displayPermissionLevel).
     */
    @GetMapping
    public List<CategoryResponse> listCategories() {
        String callerRole = getCallerRole();
        return categoryService.listCategories(callerRole);
    }

    @PostMapping
    @PreAuthorize("hasRole('ROLE_STAFF')")
    public ResponseEntity<CategoryResponse> createCategory(@RequestBody CreateCategoryRequest req) {
        return ResponseEntity.status(201).body(categoryService.createCategory(req));
    }

    @GetMapping("/{id}")
    public CategoryResponse getCategory(@PathVariable Integer id) {
        return categoryService.getCategory(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_STAFF')")
    public CategoryResponse updateCategory(@PathVariable Integer id, @RequestBody CreateCategoryRequest req) {
        return categoryService.updateCategory(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_STAFF')")
    public ResponseEntity<Void> deleteCategory(@PathVariable Integer id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/action-responses")
    @PreAuthorize("hasRole('ROLE_STAFF')")
    public List<CategoryResponse.CategoryActionResponseDTO> listActionResponses(@PathVariable Integer id) {
        return categoryService.listCategoryActionResponses(id);
    }

    @PostMapping("/{id}/action-responses")
    @PreAuthorize("hasRole('ROLE_STAFF')")
    public ResponseEntity<CategoryResponse> upsertActionResponse(@PathVariable Integer id,
                                                                   @RequestBody CategoryActionResponseRequest req) {
        CategoryResponse resp = categoryService.upsertCategoryActionResponse(
                id, req.getActionId(), req.getTemplate(), req.getReplyEmail());
        return ResponseEntity.status(201).body(resp);
    }

    @DeleteMapping("/{id}/action-responses/{rid}")
    @PreAuthorize("hasRole('ROLE_STAFF')")
    public ResponseEntity<Void> deleteActionResponse(@PathVariable Integer id, @PathVariable Integer rid) {
        categoryService.deleteCategoryActionResponse(rid);
        return ResponseEntity.noContent().build();
    }

    private String getCallerRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return "anonymous";
        Object principal = auth.getPrincipal();
        if (principal instanceof JwtUserDetails userDetails) {
            return userDetails.getRole();
        }
        return "anonymous";
    }
}
