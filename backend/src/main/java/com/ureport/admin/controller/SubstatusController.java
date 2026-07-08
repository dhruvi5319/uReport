package com.ureport.admin.controller;

import com.ureport.admin.dto.CreateSubstatusRequest;
import com.ureport.admin.dto.SubstatusDto;
import com.ureport.admin.service.SubstatusService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/substatuses")
public class SubstatusController {

    private final SubstatusService substatusService;

    public SubstatusController(SubstatusService substatusService) {
        this.substatusService = substatusService;
    }

    /**
     * GET /api/substatuses — JWT required (any authenticated role)
     */
    @GetMapping
    public ResponseEntity<List<SubstatusDto>> listSubstatuses() {
        return ResponseEntity.ok(substatusService.listSubstatuses());
    }

    /**
     * POST /api/substatuses — admin only
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SubstatusDto> createSubstatus(@Valid @RequestBody CreateSubstatusRequest req) {
        return ResponseEntity.status(201).body(substatusService.createSubstatus(req));
    }

    /**
     * PUT /api/substatuses/{id} — admin only
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SubstatusDto> updateSubstatus(
            @PathVariable Long id,
            @Valid @RequestBody CreateSubstatusRequest req) {
        return ResponseEntity.ok(substatusService.updateSubstatus(id, req));
    }

    /**
     * DELETE /api/substatuses/{id} — admin only; 403 for seeded ids 1-3
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteSubstatus(@PathVariable Long id) {
        substatusService.deleteSubstatus(id);
        return ResponseEntity.noContent().build();
    }
}
