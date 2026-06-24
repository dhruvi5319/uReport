package com.ureport.controller;

import com.ureport.dto.request.CreateContactMethodRequest;
import com.ureport.dto.response.ContactMethodResponse;
import com.ureport.entity.ContactMethod;
import com.ureport.exception.NotFoundException;
import com.ureport.exception.ValidationException;
import com.ureport.repository.ContactMethodRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/contact-methods")
public class ContactMethodController {

    private final ContactMethodRepository contactMethodRepository;

    public ContactMethodController(ContactMethodRepository contactMethodRepository) {
        this.contactMethodRepository = contactMethodRepository;
    }

    /**
     * Public endpoint — no auth required.
     * Returns all 4 seeded contact methods.
     */
    @GetMapping
    public List<ContactMethodResponse> listContactMethods() {
        return contactMethodRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @PostMapping
    @PreAuthorize("hasRole('ROLE_STAFF')")
    public ResponseEntity<ContactMethodResponse> createContactMethod(@RequestBody CreateContactMethodRequest req) {
        ContactMethod cm = new ContactMethod();
        cm.setName(req.getName());
        cm.setSystem(false);
        cm = contactMethodRepository.save(cm);
        return ResponseEntity.status(201).body(toResponse(cm));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_STAFF')")
    public ResponseEntity<Void> deleteContactMethod(@PathVariable Integer id) {
        ContactMethod cm = contactMethodRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("CONTACT_METHOD_NOT_FOUND",
                        "Contact method not found: " + id));
        if (cm.isSystem()) {
            throw new ValidationException("SYSTEM_CONTACT_METHOD_NOT_DELETABLE",
                    "System contact methods cannot be deleted");
        }
        contactMethodRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private ContactMethodResponse toResponse(ContactMethod cm) {
        ContactMethodResponse resp = new ContactMethodResponse();
        resp.setId(cm.getId());
        resp.setName(cm.getName());
        resp.setIsSystem(cm.isSystem());
        return resp;
    }
}
