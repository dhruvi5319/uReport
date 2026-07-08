package com.ureport.admin.controller;

import com.ureport.admin.dto.ContactMethodDto;
import com.ureport.admin.service.ContactMethodService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contact-methods")
public class ContactMethodController {

    private final ContactMethodService contactMethodService;

    public ContactMethodController(ContactMethodService contactMethodService) {
        this.contactMethodService = contactMethodService;
    }

    /**
     * GET /api/contact-methods — JWT required (any authenticated role)
     */
    @GetMapping
    public ResponseEntity<List<ContactMethodDto>> listContactMethods() {
        return ResponseEntity.ok(contactMethodService.listContactMethods());
    }

    /**
     * POST /api/contact-methods — admin only; accepts { "name": "..." }
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ContactMethodDto> createContactMethod(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("name is required");
        }
        return ResponseEntity.status(201).body(contactMethodService.createContactMethod(name));
    }

    /**
     * PUT /api/contact-methods/{id} — admin only; accepts { "name": "..." }
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ContactMethodDto> updateContactMethod(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String name = body.get("name");
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("name is required");
        }
        return ResponseEntity.ok(contactMethodService.updateContactMethod(id, name));
    }

    /**
     * DELETE /api/contact-methods/{id} — admin only; 403 for seeded ids 1-4
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteContactMethod(@PathVariable Long id) {
        contactMethodService.deleteContactMethod(id);
        return ResponseEntity.noContent().build();
    }
}
