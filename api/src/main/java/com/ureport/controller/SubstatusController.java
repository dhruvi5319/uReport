package com.ureport.controller;

import com.ureport.dto.request.CreateSubstatusRequest;
import com.ureport.dto.request.UpdateSubstatusRequest;
import com.ureport.dto.response.SubstatusResponse;
import com.ureport.service.SubstatusService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/substatus")
@PreAuthorize("hasRole('ROLE_STAFF')")
public class SubstatusController {

    private final SubstatusService substatusService;

    public SubstatusController(SubstatusService substatusService) {
        this.substatusService = substatusService;
    }

    @GetMapping
    public List<SubstatusResponse> listSubstatuses() {
        return substatusService.listSubstatuses();
    }

    @PostMapping
    public ResponseEntity<SubstatusResponse> createSubstatus(@RequestBody CreateSubstatusRequest req) {
        return ResponseEntity.status(201).body(substatusService.createSubstatus(req));
    }

    @PatchMapping("/{id}")
    public SubstatusResponse updateSubstatus(@PathVariable Integer id, @RequestBody UpdateSubstatusRequest req) {
        return substatusService.updateSubstatus(id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubstatus(@PathVariable Integer id) {
        substatusService.deleteSubstatus(id);
        return ResponseEntity.noContent().build();
    }
}
