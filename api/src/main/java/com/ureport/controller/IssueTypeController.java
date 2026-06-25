package com.ureport.controller;

import com.ureport.dto.request.CreateIssueTypeRequest;
import com.ureport.dto.response.IssueTypeResponse;
import com.ureport.entity.IssueType;
import com.ureport.exception.NotFoundException;
import com.ureport.exception.ValidationException;
import com.ureport.repository.IssueTypeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/issue-types")
public class IssueTypeController {

    private final IssueTypeRepository issueTypeRepository;

    public IssueTypeController(IssueTypeRepository issueTypeRepository) {
        this.issueTypeRepository = issueTypeRepository;
    }

    /**
     * Public endpoint — no auth required.
     * Returns all 6 seeded issue types.
     */
    @GetMapping
    public List<IssueTypeResponse> listIssueTypes() {
        return issueTypeRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @PostMapping
    @PreAuthorize("hasRole('ROLE_STAFF')")
    public ResponseEntity<IssueTypeResponse> createIssueType(@RequestBody CreateIssueTypeRequest req) {
        IssueType it = new IssueType();
        it.setName(req.getName());
        it.setSystem(false);
        it = issueTypeRepository.save(it);
        return ResponseEntity.status(201).body(toResponse(it));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_STAFF')")
    public ResponseEntity<Void> deleteIssueType(@PathVariable Integer id) {
        IssueType it = issueTypeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("ISSUE_TYPE_NOT_FOUND",
                        "Issue type not found: " + id));
        if (it.isSystem()) {
            throw new ValidationException("SYSTEM_ISSUE_TYPE_NOT_DELETABLE",
                    "System issue types cannot be deleted");
        }
        issueTypeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private IssueTypeResponse toResponse(IssueType it) {
        IssueTypeResponse resp = new IssueTypeResponse();
        resp.setId(it.getId());
        resp.setName(it.getName());
        resp.setIsSystem(it.isSystem());
        return resp;
    }
}
