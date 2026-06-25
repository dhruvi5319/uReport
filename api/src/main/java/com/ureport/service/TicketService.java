package com.ureport.service;

import com.ureport.dto.request.CloseTicketRequest;
import com.ureport.dto.request.CreateTicketRequest;
import com.ureport.dto.request.UpdateTicketRequest;
import com.ureport.entity.Person;
import com.ureport.entity.Substatus;
import com.ureport.entity.Ticket;
import com.ureport.exception.InvalidTransitionException;
import com.ureport.exception.NotFoundException;
import com.ureport.exception.PermissionDeniedException;
import com.ureport.exception.ValidationException;
import com.ureport.repository.*;
import com.ureport.security.PermissionEvaluator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Optional;

@Service
@Transactional
public class TicketService {

    // Seeded action IDs — MUST match 03-seed.sql
    private static final int ACTION_OPEN            = 1;
    private static final int ACTION_ASSIGNMENT      = 2;
    private static final int ACTION_CLOSED          = 3;
    private static final int ACTION_CHANGE_CATEGORY = 4;
    private static final int ACTION_CHANGE_LOCATION = 5;
    private static final int ACTION_DUPLICATE       = 7;
    private static final int ACTION_UPDATE          = 8;
    private static final int ACTION_COMMENT         = 9;

    // Seeded substatus IDs — MUST match 03-seed.sql
    private static final int SUBSTATUS_DUPLICATE    = 3;

    private final TicketRepository ticketRepository;
    private final TicketHistoryService ticketHistoryService;
    private final CategoryRepository categoryRepository;
    private final SubstatusRepository substatusRepository;
    private final PersonRepository personRepository;
    private final PeopleEmailRepository peopleEmailRepository;
    private final PermissionEvaluator permissionEvaluator;

    public TicketService(TicketRepository ticketRepository,
                         TicketHistoryService ticketHistoryService,
                         CategoryRepository categoryRepository,
                         SubstatusRepository substatusRepository,
                         PersonRepository personRepository,
                         PeopleEmailRepository peopleEmailRepository,
                         PermissionEvaluator permissionEvaluator) {
        this.ticketRepository = ticketRepository;
        this.ticketHistoryService = ticketHistoryService;
        this.categoryRepository = categoryRepository;
        this.substatusRepository = substatusRepository;
        this.personRepository = personRepository;
        this.peopleEmailRepository = peopleEmailRepository;
        this.permissionEvaluator = permissionEvaluator;
    }

    /**
     * Creates a new ticket with 'open' status and appends an 'open' history entry.
     */
    public Ticket createTicket(CreateTicketRequest req, Integer enteredByPersonId, String callerRole) {
        // 1. Load and validate category
        var category = categoryRepository.findById(req.categoryId())
                .filter(c -> Boolean.TRUE.equals(c.getActive()))
                .orElseThrow(() -> new NotFoundException("CATEGORY_NOT_FOUND",
                        "Category not found or inactive: " + req.categoryId()));

        // 2. Check posting permission
        if (!permissionEvaluator.isAllowed(callerRole, category.getPostingPermissionLevel())) {
            throw new PermissionDeniedException("PERMISSION_DENIED",
                    "Insufficient permission to post to this category");
        }

        // 3. Validate description
        if (req.description() == null || req.description().isBlank()) {
            throw new ValidationException("DESCRIPTION_REQUIRED", "Description is required");
        }

        // 4. Validate coordinates if provided
        if (req.latitude() != null || req.longitude() != null) {
            if (req.latitude() == null || req.longitude() == null) {
                throw new ValidationException("INVALID_COORDINATES",
                        "Both latitude and longitude must be provided together");
            }
            BigDecimal lat = req.latitude();
            BigDecimal lon = req.longitude();
            if (lat.compareTo(BigDecimal.valueOf(-90)) < 0 || lat.compareTo(BigDecimal.valueOf(90)) > 0) {
                throw new ValidationException("INVALID_COORDINATES",
                        "Latitude must be between -90 and 90");
            }
            if (lon.compareTo(BigDecimal.valueOf(-180)) < 0 || lon.compareTo(BigDecimal.valueOf(180)) > 0) {
                throw new ValidationException("INVALID_COORDINATES",
                        "Longitude must be between -180 and 180");
            }
        }

        // 5. Resolve reporter person
        Integer reportedByPersonId = req.reportedByPersonId();
        if (reportedByPersonId == null && req.reporterEmail() != null && !req.reporterEmail().isBlank()) {
            // Try to find existing person by email
            Optional<com.ureport.entity.PeopleEmail> emailRecord =
                    peopleEmailRepository.findFirstByEmail(req.reporterEmail());
            if (emailRecord.isPresent()) {
                reportedByPersonId = emailRecord.get().getPersonId();
            } else if (req.reporterFirstname() != null && req.reporterLastname() != null) {
                // Create minimal Person record for reporter
                Person reporter = new Person();
                reporter.setFirstname(req.reporterFirstname());
                reporter.setLastname(req.reporterLastname());
                reporter.setRole("public");
                reporter = personRepository.save(reporter);
                // Create email record
                com.ureport.entity.PeopleEmail newEmail = new com.ureport.entity.PeopleEmail();
                newEmail.setPerson(reporter);
                newEmail.setEmail(req.reporterEmail());
                newEmail.setUsedForNotifications(true);
                peopleEmailRepository.save(newEmail);
                reportedByPersonId = reporter.getId();
            }
        }

        // 6. Look up default open substatus
        Substatus defaultOpenSubstatus = substatusRepository
                .findFirstByStatusAndIsDefaultTrue("open")
                .orElseThrow(() -> new ValidationException("SUBSTATUS_NOT_FOUND",
                        "No default open substatus found"));

        // 7. Build ticket entity
        Ticket ticket = new Ticket();
        ticket.setCategoryId(req.categoryId());
        ticket.setDescription(req.description());
        ticket.setIssueTypeId(req.issueTypeId());
        ticket.setContactMethodId(req.contactMethodId());
        ticket.setResponseMethodId(req.responseMethodId());
        ticket.setEnteredByPersonId(enteredByPersonId);
        ticket.setReportedByPersonId(reportedByPersonId);
        ticket.setLocation(req.location());
        ticket.setCity(req.city());
        ticket.setState(req.state());
        ticket.setZip(req.zip());
        ticket.setLatitude(req.latitude());
        ticket.setLongitude(req.longitude());
        ticket.setAddressId(req.addressId());
        ticket.setAdditionalFields(req.additionalFields());
        ticket.setCustomFields(req.customFields());
        ticket.setStatus("open");
        ticket.setSubstatusId(defaultOpenSubstatus.getId());

        // 8. Set default assignee from category if not assigned
        if (ticket.getAssignedPersonId() == null && category.getDefaultPersonId() != null) {
            ticket.setAssignedPersonId(category.getDefaultPersonId());
        }

        // 9. Save ticket
        ticket = ticketRepository.save(ticket);

        // 10. Append 'open' history entry
        ticketHistoryService.append(ticket.getId(), ACTION_OPEN, enteredByPersonId, null, null, null);

        return ticket;
    }

    /**
     * Assigns a ticket to a staff person.
     */
    public Ticket assignTicket(Long ticketId, Integer assignedPersonId, Integer staffPersonId) {
        // 1. Load ticket
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new NotFoundException("TICKET_NOT_FOUND", "Ticket not found: " + ticketId));

        // 2. Validate assignee is staff
        Person assignee = personRepository.findById(assignedPersonId)
                .orElseThrow(() -> new ValidationException("INVALID_ASSIGNEE", "Assignee person not found"));
        if (!"staff".equalsIgnoreCase(assignee.getRole())) {
            throw new ValidationException("INVALID_ASSIGNEE", "Can only assign tickets to staff members");
        }

        // 3. Update assignment
        ticket.setAssignedPersonId(assignedPersonId);

        // 4. Save and append history
        ticket = ticketRepository.save(ticket);
        ticketHistoryService.append(ticket.getId(), ACTION_ASSIGNMENT, staffPersonId, assignedPersonId, null, null);

        return ticket;
    }

    /**
     * Updates ticket fields and appends appropriate history entries.
     */
    public Ticket updateTicket(Long ticketId, UpdateTicketRequest req, Integer staffPersonId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new NotFoundException("TICKET_NOT_FOUND", "Ticket not found: " + ticketId));

        boolean categoryChanged = false;
        boolean locationChanged = false;
        StringBuilder dataJson = new StringBuilder();

        // Track category change
        if (req.categoryId() != null && !req.categoryId().equals(ticket.getCategoryId())) {
            String categoryChangeData = String.format(
                    "{\"original\":{\"category_id\":%d},\"updated\":{\"category_id\":%d}}",
                    ticket.getCategoryId(), req.categoryId());
            ticketHistoryService.append(ticket.getId(), ACTION_CHANGE_CATEGORY, staffPersonId, null, null, categoryChangeData);
            ticket.setCategoryId(req.categoryId());
            categoryChanged = true;
        }

        // Track location change
        boolean locationDataChanged = false;
        String originalLocation = ticket.getLocation();
        if (req.location() != null && !req.location().equals(ticket.getLocation())) {
            locationDataChanged = true;
        }
        if (locationDataChanged) {
            String locationChangeData = String.format(
                    "{\"original\":{\"location\":\"%s\"},\"updated\":{\"location\":\"%s\"}}",
                    originalLocation != null ? originalLocation : "",
                    req.location() != null ? req.location() : "");
            ticketHistoryService.append(ticket.getId(), ACTION_CHANGE_LOCATION, staffPersonId, null, null, locationChangeData);
            locationChanged = true;
        }

        // Apply all field updates
        if (req.description() != null) ticket.setDescription(req.description());
        if (req.issueTypeId() != null) ticket.setIssueTypeId(req.issueTypeId());
        if (req.contactMethodId() != null) ticket.setContactMethodId(req.contactMethodId());
        if (req.responseMethodId() != null) ticket.setResponseMethodId(req.responseMethodId());
        if (req.location() != null) ticket.setLocation(req.location());
        if (req.city() != null) ticket.setCity(req.city());
        if (req.state() != null) ticket.setState(req.state());
        if (req.zip() != null) ticket.setZip(req.zip());
        if (req.latitude() != null) ticket.setLatitude(req.latitude());
        if (req.longitude() != null) ticket.setLongitude(req.longitude());
        if (req.addressId() != null) ticket.setAddressId(req.addressId());
        if (req.additionalFields() != null) ticket.setAdditionalFields(req.additionalFields());
        if (req.customFields() != null) ticket.setCustomFields(req.customFields());

        ticket = ticketRepository.save(ticket);

        // Append general update history
        if (!categoryChanged && !locationChanged) {
            ticketHistoryService.append(ticket.getId(), ACTION_UPDATE, staffPersonId, null, req.notes(), null);
        }

        return ticket;
    }

    /**
     * Closes a ticket with a specific substatus.
     */
    public Ticket closeTicket(Long ticketId, CloseTicketRequest req, Integer staffPersonId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new NotFoundException("TICKET_NOT_FOUND", "Ticket not found: " + ticketId));

        if ("closed".equals(ticket.getStatus())) {
            throw new InvalidTransitionException("INVALID_TRANSITION", "Ticket is already closed");
        }

        // Validate substatus is of type 'closed'
        Substatus substatus = substatusRepository.findById(req.substatusId())
                .orElseThrow(() -> new ValidationException("INVALID_SUBSTATUS",
                        "Substatus not found: " + req.substatusId()));
        if (!"closed".equals(substatus.getStatus())) {
            throw new ValidationException("INVALID_SUBSTATUS",
                    "Substatus must be a 'closed' type substatus");
        }

        ticket.setStatus("closed");
        ticket.setClosedDate(OffsetDateTime.now());
        ticket.setSubstatusId(req.substatusId());

        ticket = ticketRepository.save(ticket);
        ticketHistoryService.append(ticket.getId(), ACTION_CLOSED, staffPersonId, null, req.notes(), null);

        return ticket;
    }

    /**
     * Marks a ticket as a duplicate of another ticket.
     */
    public Ticket markDuplicate(Long ticketId, Long parentId, Integer staffPersonId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new NotFoundException("TICKET_NOT_FOUND", "Ticket not found: " + ticketId));

        Ticket parent = ticketRepository.findById(parentId)
                .orElseThrow(() -> new NotFoundException("TICKET_NOT_FOUND", "Parent ticket not found: " + parentId));

        // Circular duplicate check
        if (parentId.equals(ticketId)) {
            throw new InvalidTransitionException("CIRCULAR_DUPLICATE", "A ticket cannot be a duplicate of itself");
        }
        // Check if parent's parent is this ticket (2-level cycle check)
        if (ticketId.equals(parent.getParentId())) {
            throw new InvalidTransitionException("CIRCULAR_DUPLICATE",
                    "Circular duplicate relationship detected");
        }

        ticket.setParentId(parentId);
        ticket.setStatus("closed");
        ticket.setClosedDate(OffsetDateTime.now());
        ticket.setSubstatusId(SUBSTATUS_DUPLICATE);

        ticket = ticketRepository.save(ticket);
        String duplicateData = "{\"duplicate\":{\"ticket_id\":" + parentId + "}}";
        ticketHistoryService.append(ticket.getId(), ACTION_DUPLICATE, staffPersonId, null, null, duplicateData);

        return ticket;
    }

    /**
     * Reopens a closed ticket.
     */
    public Ticket reopenTicket(Long ticketId, String reason, Integer staffPersonId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new NotFoundException("TICKET_NOT_FOUND", "Ticket not found: " + ticketId));

        if ("open".equals(ticket.getStatus())) {
            throw new InvalidTransitionException("INVALID_TRANSITION", "Ticket is already open");
        }

        // Load default open substatus
        Substatus defaultOpen = substatusRepository
                .findFirstByStatusAndIsDefaultTrue("open")
                .orElseThrow(() -> new ValidationException("SUBSTATUS_NOT_FOUND",
                        "No default open substatus found"));

        ticket.setStatus("open");
        ticket.setClosedDate(null);
        ticket.setSubstatusId(defaultOpen.getId());

        ticket = ticketRepository.save(ticket);

        String notes = (reason != null && !reason.isBlank()) ? reason : "Reopened";
        ticketHistoryService.append(ticket.getId(), ACTION_UPDATE, staffPersonId, null, notes, null);

        return ticket;
    }

    /**
     * Adds a comment to a ticket.
     */
    public void addComment(Long ticketId, String notes, Integer personId) {
        // 1. Load ticket
        ticketRepository.findById(ticketId)
                .orElseThrow(() -> new NotFoundException("TICKET_NOT_FOUND", "Ticket not found: " + ticketId));

        // 2. Validate notes
        if (notes == null || notes.isBlank()) {
            throw new ValidationException("NOTES_REQUIRED", "Comment notes cannot be empty");
        }

        // 3. Append comment history
        ticketHistoryService.append(ticketId, ACTION_COMMENT, personId, null, notes, null);
    }

    /**
     * Retrieves a single ticket by ID.
     */
    @Transactional(readOnly = true)
    public Ticket getTicket(Long ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new NotFoundException("TICKET_NOT_FOUND", "Ticket not found: " + ticketId));
    }

    /**
     * Deletes a ticket (staff only).
     */
    public void deleteTicket(Long ticketId) {
        if (!ticketRepository.existsById(ticketId)) {
            throw new NotFoundException("TICKET_NOT_FOUND", "Ticket not found: " + ticketId);
        }
        ticketRepository.deleteById(ticketId);
    }
}
