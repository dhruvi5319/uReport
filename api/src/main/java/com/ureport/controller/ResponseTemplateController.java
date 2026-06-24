package com.ureport.controller;

import com.ureport.entity.ResponseTemplate;
import com.ureport.service.ResponseTemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/response-templates")
@PreAuthorize("hasRole('STAFF')")
public class ResponseTemplateController {

    private final ResponseTemplateService responseTemplateService;

    @Autowired
    public ResponseTemplateController(ResponseTemplateService responseTemplateService) {
        this.responseTemplateService = responseTemplateService;
    }

    /**
     * GET /api/v1/response-templates — list all (or ?action_id= to filter)
     */
    @GetMapping
    public ResponseEntity<List<ResponseTemplate>> listTemplates(
            @RequestParam(required = false) Integer action_id) {
        return ResponseEntity.ok(responseTemplateService.listTemplates(action_id));
    }

    /**
     * POST /api/v1/response-templates — create template
     */
    @PostMapping
    public ResponseEntity<ResponseTemplate> createTemplate(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String template = (String) body.get("template");
        Integer actionId = body.get("action_id") != null
                ? ((Number) body.get("action_id")).intValue() : null;

        return ResponseEntity.ok(responseTemplateService.createTemplate(name, template, actionId));
    }

    /**
     * GET /api/v1/response-templates/{id} — template detail
     */
    @GetMapping("/{id}")
    public ResponseEntity<ResponseTemplate> getTemplate(@PathVariable Integer id) {
        return ResponseEntity.ok(responseTemplateService.getTemplate(id));
    }

    /**
     * PUT /api/v1/response-templates/{id} — update template
     */
    @PutMapping("/{id}")
    public ResponseEntity<ResponseTemplate> updateTemplate(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String template = (String) body.get("template");
        Integer actionId = body.get("action_id") != null
                ? ((Number) body.get("action_id")).intValue() : null;

        return ResponseEntity.ok(responseTemplateService.updateTemplate(id, name, template, actionId));
    }

    /**
     * DELETE /api/v1/response-templates/{id} — delete template
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteTemplate(@PathVariable Integer id) {
        responseTemplateService.deleteTemplate(id);
        return ResponseEntity.ok(Map.of("status", "deleted"));
    }
}
