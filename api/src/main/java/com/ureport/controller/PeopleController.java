package com.ureport.controller;

import com.ureport.dto.request.CreatePersonRequest;
import com.ureport.dto.request.UpdatePersonRequest;
import com.ureport.dto.response.PersonResponse;
import com.ureport.service.PersonService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/people")
@PreAuthorize("hasRole('ROLE_STAFF')")
public class PeopleController {

    private final PersonService personService;

    public PeopleController(PersonService personService) {
        this.personService = personService;
    }

    @GetMapping
    public Page<PersonResponse> searchPeople(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String role,
            @RequestParam(name = "department_id", required = false) Integer departmentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int limit) {
        return personService.searchPeople(q, role, departmentId, page, limit);
    }

    @PostMapping
    public ResponseEntity<PersonResponse> createPerson(@RequestBody CreatePersonRequest req) {
        return ResponseEntity.status(201).body(personService.createPerson(req));
    }

    @GetMapping("/{id}")
    public PersonResponse getPerson(@PathVariable Integer id) {
        return personService.getPerson(id);
    }

    @PutMapping("/{id}")
    public PersonResponse updatePerson(@PathVariable Integer id, @RequestBody UpdatePersonRequest req) {
        return personService.updatePerson(id, req);
    }

    @PatchMapping("/{id}")
    public PersonResponse partialUpdatePerson(@PathVariable Integer id, @RequestBody UpdatePersonRequest req) {
        return personService.updatePerson(id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePerson(@PathVariable Integer id) {
        personService.softDeletePerson(id);
        return ResponseEntity.noContent().build();
    }

    // Email sub-resources
    @PostMapping("/{id}/emails")
    public ResponseEntity<PersonResponse> addEmail(@PathVariable Integer id,
                                                    @RequestBody CreatePersonRequest.CreateEmailRequest req) {
        return ResponseEntity.status(201).body(personService.addEmail(id, req));
    }

    @PutMapping("/{id}/emails/{emailId}")
    public PersonResponse updateEmail(@PathVariable Integer id,
                                       @PathVariable Integer emailId,
                                       @RequestBody CreatePersonRequest.CreateEmailRequest req) {
        return personService.updateEmail(id, emailId, req);
    }

    @DeleteMapping("/{id}/emails/{emailId}")
    public ResponseEntity<Void> deleteEmail(@PathVariable Integer id, @PathVariable Integer emailId) {
        personService.deleteEmail(id, emailId);
        return ResponseEntity.noContent().build();
    }

    // Phone sub-resources
    @PostMapping("/{id}/phones")
    public ResponseEntity<PersonResponse> addPhone(@PathVariable Integer id,
                                                    @RequestBody CreatePersonRequest.CreatePhoneRequest req) {
        return ResponseEntity.status(201).body(personService.addPhone(id, req));
    }

    @PutMapping("/{id}/phones/{phoneId}")
    public PersonResponse updatePhone(@PathVariable Integer id,
                                       @PathVariable Integer phoneId,
                                       @RequestBody CreatePersonRequest.CreatePhoneRequest req) {
        return personService.updatePhone(id, phoneId, req);
    }

    @DeleteMapping("/{id}/phones/{phoneId}")
    public ResponseEntity<Void> deletePhone(@PathVariable Integer id, @PathVariable Integer phoneId) {
        personService.deletePhone(id, phoneId);
        return ResponseEntity.noContent().build();
    }

    // Address sub-resources
    @PostMapping("/{id}/addresses")
    public ResponseEntity<PersonResponse> addAddress(@PathVariable Integer id,
                                                      @RequestBody CreatePersonRequest.CreateAddressRequest req) {
        return ResponseEntity.status(201).body(personService.addAddress(id, req));
    }

    @PutMapping("/{id}/addresses/{addrId}")
    public PersonResponse updateAddress(@PathVariable Integer id,
                                         @PathVariable Integer addrId,
                                         @RequestBody CreatePersonRequest.CreateAddressRequest req) {
        return personService.updateAddress(id, addrId, req);
    }

    @DeleteMapping("/{id}/addresses/{addrId}")
    public ResponseEntity<Void> deleteAddress(@PathVariable Integer id, @PathVariable Integer addrId) {
        personService.deleteAddress(id, addrId);
        return ResponseEntity.noContent().build();
    }
}
