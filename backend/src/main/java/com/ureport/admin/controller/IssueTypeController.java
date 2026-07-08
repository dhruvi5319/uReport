package com.ureport.admin.controller;

import com.ureport.admin.dto.IssueTypeDto;
import com.ureport.admin.service.IssueTypeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/issue-types")
public class IssueTypeController {

    private final IssueTypeService issueTypeService;

    public IssueTypeController(IssueTypeService issueTypeService) {
        this.issueTypeService = issueTypeService;
    }

    /**
     * GET /api/issue-types — JWT required (any authenticated role)
     */
    @GetMapping
    public ResponseEntity<List<IssueTypeDto>> listIssueTypes() {
        return ResponseEntity.ok(issueTypeService.listIssueTypes());
    }

    /**
     * POST /api/issue-types — admin only; accepts { "name": "..." }
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<IssueTypeDto> createIssueType(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("name is required");
        }
        return ResponseEntity.status(201).body(issueTypeService.createIssueType(name));
    }

    /**
     * PUT /api/issue-types/{id} — admin only; accepts { "name": "..." }
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<IssueTypeDto> updateIssueType(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String name = body.get("name");
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("name is required");
        }
        return ResponseEntity.ok(issueTypeService.updateIssueType(id, name));
    }

    /**
     * DELETE /api/issue-types/{id} — admin only; 403 for seeded ids 1-6
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteIssueType(@PathVariable Long id) {
        issueTypeService.deleteIssueType(id);
        return ResponseEntity.noContent().build();
    }
}
