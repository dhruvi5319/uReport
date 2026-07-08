package com.ureport.admin.controller;

import com.ureport.admin.dto.CreateActionRequest;
import com.ureport.admin.dto.UpdateActionRequest;
import com.ureport.admin.service.ActionService;
import com.ureport.crm.dto.ActionDto;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/actions")
public class ActionController {

    private final ActionService actionService;

    public ActionController(ActionService actionService) {
        this.actionService = actionService;
    }

    /**
     * GET /api/actions — JWT required; returns all (system + department) actions
     */
    @GetMapping
    public ResponseEntity<List<ActionDto>> listActions() {
        return ResponseEntity.ok(actionService.listActions());
    }

    /**
     * POST /api/actions — admin only; creates department-type action
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ActionDto> createAction(@Valid @RequestBody CreateActionRequest req) {
        return ResponseEntity.status(201).body(actionService.createAction(req));
    }

    /**
     * PUT /api/actions/{id} — admin only; updates template + replyEmail on any action
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ActionDto> updateAction(
            @PathVariable Long id,
            @RequestBody UpdateActionRequest req) {
        return ResponseEntity.ok(actionService.updateAction(id, req));
    }

    /**
     * DELETE /api/actions/{id} — admin only; department-type only; 403 for system-type
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAction(@PathVariable Long id) {
        actionService.deleteAction(id);
        return ResponseEntity.noContent().build();
    }
}
