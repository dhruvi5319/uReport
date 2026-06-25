package com.ureport.controller;

import com.ureport.dto.request.CreateCategoryGroupRequest;
import com.ureport.dto.request.ReorderGroupsRequest;
import com.ureport.dto.response.CategoryGroupResponse;
import com.ureport.service.CategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/category-groups")
@PreAuthorize("hasRole('ROLE_STAFF')")
public class CategoryGroupController {

    private final CategoryService categoryService;

    public CategoryGroupController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public List<CategoryGroupResponse> listGroups() {
        return categoryService.listCategoryGroups();
    }

    @PostMapping
    public ResponseEntity<CategoryGroupResponse> createGroup(@RequestBody CreateCategoryGroupRequest req) {
        return ResponseEntity.status(201).body(categoryService.createCategoryGroup(req));
    }

    @GetMapping("/{id}")
    public CategoryGroupResponse getGroupWithCategories(@PathVariable Integer id) {
        return categoryService.getCategoryGroup(id);
    }

    @PutMapping("/{id}")
    public CategoryGroupResponse updateGroup(@PathVariable Integer id, @RequestBody CreateCategoryGroupRequest req) {
        return categoryService.updateCategoryGroup(id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(@PathVariable Integer id) {
        categoryService.deleteCategoryGroup(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/order")
    public ResponseEntity<Void> reorderGroups(@RequestBody ReorderGroupsRequest req) {
        categoryService.reorderGroups(req);
        return ResponseEntity.ok().build();
    }
}
