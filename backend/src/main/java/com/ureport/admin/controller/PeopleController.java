package com.ureport.admin.controller;

import com.ureport.admin.dto.*;
import com.ureport.admin.service.PeopleService;
import com.ureport.crm.exception.BusinessException;
import com.ureport.domain.Ticket;
import com.ureport.repository.PersonRepository;
import com.ureport.repository.TicketRepository;
import com.ureport.security.PersonDetails;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * REST controller for People management API (F6).
 *
 * Endpoints:
 * GET    /api/people                  → 200 PersonPageDto       (JWT required)
 * POST   /api/people                  → 201 PersonDetailDto     (ADMIN only)
 * GET    /api/people/{id}             → 200 PersonDetailDto     (JWT required)
 * PUT    /api/people/{id}             → 200 PersonDetailDto     (ADMIN only)
 * DELETE /api/people/{id}             → 204                     (ADMIN only)
 * GET    /api/people/{id}/tickets     → 200 List<TicketListItemDto>  (JWT required)
 *
 * Security (T-05-01): @PreAuthorize("hasRole('ADMIN')") on write endpoints.
 */
@RestController
@RequestMapping("/api/people")
public class PeopleController {

    /** Minimal ticket reference returned by GET /api/people/{id}/tickets. */
    public record TicketListItemDto(Long id, String description, String status) {}

    private final PeopleService peopleService;
    private final PersonRepository personRepository;
    private final TicketRepository ticketRepository;

    public PeopleController(PeopleService peopleService,
                             PersonRepository personRepository,
                             TicketRepository ticketRepository) {
        this.peopleService = peopleService;
        this.personRepository = personRepository;
        this.ticketRepository = ticketRepository;
    }

    /**
     * GET /api/people — paginated, searchable person list.
     * Requires any authenticated user.
     */
    @GetMapping
    public ResponseEntity<PersonPageDto> listPeople(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(name = "page_size", defaultValue = "20") int pageSize) {
        return ResponseEntity.ok(peopleService.listPeople(q, role, page, pageSize));
    }

    /**
     * POST /api/people — create a new person.
     * Requires ADMIN role.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PersonDetailDto> createPerson(@RequestBody CreatePersonRequest req) {
        PersonDetails cu = currentUser();
        return ResponseEntity.status(201).body(peopleService.createPerson(req, cu));
    }

    /**
     * GET /api/people/{id} — get full person detail.
     * Requires any authenticated user.
     */
    @GetMapping("/{id}")
    public ResponseEntity<PersonDetailDto> getPerson(@PathVariable Long id) {
        return ResponseEntity.ok(peopleService.getPerson(id));
    }

    /**
     * PUT /api/people/{id} — update person and reconcile sub-resource arrays.
     * Requires ADMIN role.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PersonDetailDto> updatePerson(
            @PathVariable Long id,
            @RequestBody UpdatePersonRequest req) {
        PersonDetails cu = currentUser();
        return ResponseEntity.ok(peopleService.updatePerson(id, req, cu));
    }

    /**
     * DELETE /api/people/{id} — delete person.
     * Returns 409 if person is referenced by tickets.
     * Requires ADMIN role.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePerson(@PathVariable Long id) {
        peopleService.deletePerson(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/people/{id}/tickets — list tickets involving this person.
     * Requires any authenticated user.
     */
    @GetMapping("/{id}/tickets")
    public ResponseEntity<List<TicketListItemDto>> getPersonTickets(@PathVariable Long id) {
        // Verify person exists — 404 if not
        personRepository.findById(id)
                .orElseThrow(() -> new BusinessException("PERSON_NOT_FOUND",
                        "Person not found", HttpStatus.NOT_FOUND));

        List<Ticket> tickets = ticketRepository
                .findByEnteredByPersonIdOrReportedByPersonIdOrAssignedPersonId(id, id, id);

        List<TicketListItemDto> result = tickets.stream()
                .map(t -> new TicketListItemDto(t.getId(), t.getDescription(), t.getStatus()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    private PersonDetails currentUser() {
        return (PersonDetails) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}
