package com.ureport.controller;

import com.ureport.dto.request.CreateActionRequest;
import com.ureport.dto.request.UpdateActionRequest;
import com.ureport.dto.response.ActionResponse;
import com.ureport.service.ActionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/actions")
@PreAuthorize("hasRole('ROLE_STAFF')")
public class ActionController {

    private final ActionService actionService;

    public ActionController(ActionService actionService) {
        this.actionService = actionService;
    }

    @GetMapping
    public List<ActionResponse> listActions() {
        return actionService.listActions();
    }

    @PostMapping
    public ResponseEntity<ActionResponse> createAction(@RequestBody CreateActionRequest req) {
        return ResponseEntity.status(201).body(actionService.createAction(req));
    }

    @PatchMapping("/{id}")
    public ActionResponse updateAction(@PathVariable Integer id, @RequestBody UpdateActionRequest req) {
        return actionService.updateAction(id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAction(@PathVariable Integer id) {
        actionService.deleteAction(id);
        return ResponseEntity.noContent().build();
    }
}
