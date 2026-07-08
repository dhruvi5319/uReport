package com.ureport.crm.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ureport.crm.dto.AssignTicketRequest;
import com.ureport.crm.dto.CloseTicketRequest;
import com.ureport.crm.dto.CreateTicketRequest;
import com.ureport.crm.dto.TicketDetailDto;
import com.ureport.crm.dto.TicketDetailDto.RefDto;
import com.ureport.crm.dto.TicketListItem;
import com.ureport.crm.dto.UpdateTicketRequest;
import com.ureport.crm.exception.BusinessException;
import com.ureport.crm.exception.TicketNotFoundException;
import com.ureport.domain.Action;
import com.ureport.domain.Category;
import com.ureport.domain.ContactMethod;
import com.ureport.domain.IssueType;
import com.ureport.domain.Person;
import com.ureport.domain.Substatus;
import com.ureport.domain.Ticket;
import com.ureport.domain.TicketHistory;
import com.ureport.repository.ActionsRepository;
import com.ureport.repository.CategoryRepository;
import com.ureport.repository.ContactMethodRepository;
import com.ureport.repository.IssueTypeRepository;
import com.ureport.repository.MediaRepository;
import com.ureport.repository.PersonRepository;
import com.ureport.repository.SubstatusRepository;
import com.ureport.repository.TicketHistoryRepository;
import com.ureport.repository.TicketRepository;
import com.ureport.security.PersonDetails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Core ticket lifecycle service — create, read, update, close, reopen, assign.
 *
 * Every state transition creates an immutable ticket_history entry (T-04-06).
 * Foreign-key IDs are validated server-side via repository lookups (T-04-01).
 */
@Service
@Transactional
public class TicketService {

    private static final Logger log = LoggerFactory.getLogger(TicketService.class);
    private static final DateTimeFormatter ISO = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'")
            .withZone(ZoneOffset.UTC);

    private final TicketRepository ticketRepository;
    private final TicketHistoryRepository ticketHistoryRepository;
    private final CategoryRepository categoryRepository;
    private final SubstatusRepository substatusRepository;
    private final PersonRepository personRepository;
    private final MediaRepository mediaRepository;
    private final ActionsRepository actionsRepository;
    private final IssueTypeRepository issueTypeRepository;
    private final ContactMethodRepository contactMethodRepository;
    private final ObjectMapper objectMapper;

    public TicketService(TicketRepository ticketRepository,
                         TicketHistoryRepository ticketHistoryRepository,
                         CategoryRepository categoryRepository,
                         SubstatusRepository substatusRepository,
                         PersonRepository personRepository,
                         MediaRepository mediaRepository,
                         ActionsRepository actionsRepository,
                         IssueTypeRepository issueTypeRepository,
                         ContactMethodRepository contactMethodRepository,
                         ObjectMapper objectMapper) {
        this.ticketRepository = ticketRepository;
        this.ticketHistoryRepository = ticketHistoryRepository;
        this.categoryRepository = categoryRepository;
        this.substatusRepository = substatusRepository;
        this.personRepository = personRepository;
        this.mediaRepository = mediaRepository;
        this.actionsRepository = actionsRepository;
        this.issueTypeRepository = issueTypeRepository;
        this.contactMethodRepository = contactMethodRepository;
        this.objectMapper = objectMapper;
    }

    // -----------------------------------------------------------------------
    // CREATE
    // -----------------------------------------------------------------------

    /**
     * POST /api/tickets — create a new ticket with status=open and "open" history entry.
     */
    public TicketDetailDto createTicket(CreateTicketRequest req, PersonDetails currentUser) {
        // 1. Validate categoryId
        if (req.getCategoryId() == null) {
            throw new BusinessException("CATEGORY_REQUIRED", "categoryId is required");
        }
        Category category = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new BusinessException("CATEGORY_NOT_FOUND",
                        "Category not found: " + req.getCategoryId()));
        if (Boolean.FALSE.equals(category.getActive())) {
            throw new BusinessException("CATEGORY_INACTIVE",
                    "Category is not active: " + req.getCategoryId());
        }

        // 2. Validate description
        if (req.getDescription() == null || req.getDescription().isBlank()) {
            throw new BusinessException("DESCRIPTION_REQUIRED", "description is required");
        }

        // 3. Validate location: either location string or lat+lon required
        boolean hasLocation = req.getLocation() != null && !req.getLocation().isBlank();
        boolean hasLatLon = req.getLatitude() != null && req.getLongitude() != null;
        if (!hasLocation && !hasLatLon) {
            throw new BusinessException("LOCATION_REQUIRED",
                    "Either location or latitude+longitude is required");
        }

        // 4. Build Ticket entity
        Ticket ticket = new Ticket();
        ticket.setStatus("open");
        ticket.setCategory(category);
        ticket.setDescription(req.getDescription());
        ticket.setLocation(req.getLocation());
        ticket.setLatitude(req.getLatitude());
        ticket.setLongitude(req.getLongitude());
        ticket.setCity(req.getCity());
        ticket.setState(req.getState());
        ticket.setZip(req.getZip());
        ticket.setEnteredDate(LocalDateTime.now());
        ticket.setLastModified(LocalDateTime.now());

        // Set enteredByPerson from current user
        personRepository.findById(currentUser.getId())
                .ifPresent(ticket::setEnteredByPerson);

        // Optional: reported by person
        if (req.getReportedByPersonId() != null) {
            personRepository.findById(req.getReportedByPersonId())
                    .ifPresent(ticket::setReportedByPerson);
        }

        // Optional: issue type
        if (req.getIssueTypeId() != null) {
            issueTypeRepository.findById(req.getIssueTypeId())
                    .ifPresent(ticket::setIssueType);
        }

        // Optional: contact method
        if (req.getContactMethodId() != null) {
            contactMethodRepository.findById(req.getContactMethodId())
                    .ifPresent(ticket::setContactMethod);
        }

        // Optional: custom fields
        if (req.getCustomFields() != null) {
            ticket.setCustomFields(serializeCustomFields(req.getCustomFields()));
        }

        // 5. Persist ticket
        ticket = ticketRepository.save(ticket);

        // 6. Create "open" history entry
        createHistoryEntry(ticket, "open", null, currentUser.getId());

        // 7. If assignedPersonId present: assign and create history
        if (req.getAssignedPersonId() != null) {
            Person assignee = personRepository.findById(req.getAssignedPersonId())
                    .orElseThrow(() -> new BusinessException("PERSON_NOT_FOUND",
                            "Person not found: " + req.getAssignedPersonId()));
            ticket.setAssignedPerson(assignee);
            ticket = ticketRepository.save(ticket);
            createHistoryEntry(ticket, "assignment", null, currentUser.getId());
        }

        return mapToDto(ticket);
    }

    // -----------------------------------------------------------------------
    // LIST (with FTS routing)
    // -----------------------------------------------------------------------

    /**
     * GET /api/tickets — list tickets with optional full-text search.
     *
     * When {@code q} is blank/absent, returns results via the existing JPA Specification path
     * (unchanged behavior) with searchSnippet = null on every item.
     *
     * When {@code q} is non-blank, routes to the native PostgreSQL FTS path using
     * plainto_tsquery on the search_vector GIN index (Phase 1 V2 migration).
     * Results are ordered by ts_rank_cd DESC, entered_date DESC.
     * searchSnippet contains ts_headline HTML with &lt;mark&gt; tags.
     *
     * Security note (T-06-01): q is passed as a named PreparedStatement bind parameter;
     * plainto_tsquery treats the value as plain phrase input (no operator injection).
     * Combined with the 255-char trim, there is no SQL injection surface.
     */
    @Transactional(readOnly = true)
    public Page<TicketListItem> listTickets(String q, String status, Long categoryId, Pageable pageable) {
        // Normalize q: null-safe trim, max 255 chars (T-06-05 — DoS guard)
        String trimmedQ = (q != null) ? q.trim() : "";
        if (trimmedQ.length() > 255) {
            trimmedQ = trimmedQ.substring(0, 255);
        }

        if (trimmedQ.isEmpty()) {
            // --- JPA Specification path (unchanged behavior) ---
            Specification<Ticket> spec = Specification.where(null);
            if (status != null && !status.isBlank()) {
                String s = status;
                spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), s));
            }
            if (categoryId != null) {
                Long cid = categoryId;
                spec = spec.and((root, query, cb) -> cb.equal(root.get("category").get("id"), cid));
            }
            Page<Ticket> page = ticketRepository.findAll(spec, pageable);
            List<TicketListItem> items = page.getContent().stream()
                    .map(t -> mapTicketToListItem(t, null))
                    .collect(Collectors.toList());
            return new PageImpl<>(items, pageable, page.getTotalElements());
        } else {
            // --- Native FTS path ---
            int pageSize = pageable.getPageSize();
            int offset = (int) pageable.getOffset();

            List<Object[]> rows = ticketRepository.searchTicketsWithFilters(
                    trimmedQ,
                    (status != null && !status.isBlank()) ? status : null,
                    categoryId,
                    pageSize,
                    offset);
            long total = ticketRepository.countSearchTickets(
                    trimmedQ,
                    (status != null && !status.isBlank()) ? status : null,
                    categoryId);

            List<TicketListItem> items = rows.stream()
                    .map(this::mapFtsRowToTicketListItem)
                    .collect(Collectors.toList());
            return new PageImpl<>(items, pageable, total);
        }
    }

    /**
     * Maps a native FTS query result row (Object[]) to TicketListItem.
     *
     * Native query column order (based on SELECT t.*, search_snippet, rank):
     *   The tickets table columns come first in their DDL order, then
     *   search_snippet is the second-to-last column and rank is the last.
     *
     * Column indices by DDL order from V1 migration:
     *   [0]  id
     *   [1]  parent_id
     *   [2]  category_id
     *   [3]  issue_type_id
     *   [4]  client_id
     *   [5]  entered_by_person_id
     *   [6]  reported_by_person_id
     *   [7]  assigned_person_id
     *   [8]  contact_method_id
     *   [9]  substatus_id
     *   [10] entered_date
     *   [11] last_modified
     *   [12] closed_date
     *   [13] address_id
     *   [14] latitude
     *   [15] longitude
     *   [16] location
     *   [17] city
     *   [18] state
     *   [19] zip
     *   [20] status
     *   [21] additional_fields
     *   [22] custom_fields
     *   [23] description
     *   [24] search_vector  (tsvector — opaque)
     *   [25] search_snippet (String — ts_headline output with &lt;mark&gt; tags)
     *   [26] rank           (Double — ts_rank_cd value)
     *
     * We use row.length - 2 for search_snippet to be robust if column count changes.
     */
    private TicketListItem mapFtsRowToTicketListItem(Object[] row) {
        TicketListItem item = new TicketListItem();

        // id — column 0
        if (row[0] != null) {
            item.setId(((Number) row[0]).longValue());
        }

        // status — column 20
        if (row.length > 20 && row[20] != null) {
            item.setStatus(row[20].toString());
        }

        // description — column 23
        if (row.length > 23 && row[23] != null) {
            item.setDescription(row[23].toString());
        }

        // location — column 16
        if (row.length > 16 && row[16] != null) {
            item.setLocation(row[16].toString());
        }

        // entered_date — column 10
        if (row.length > 10 && row[10] != null) {
            item.setEnteredDate(row[10].toString());
        }

        // search_snippet — second-to-last column (robust to schema evolution)
        int snippetIdx = row.length - 2;
        if (snippetIdx >= 0 && row[snippetIdx] != null) {
            item.setSearchSnippet(row[snippetIdx].toString());
        }

        return item;
    }

    /**
     * Maps a Ticket entity to TicketListItem for the non-FTS path.
     * searchSnippet is always null here (no FTS active).
     */
    private TicketListItem mapTicketToListItem(Ticket ticket, String searchSnippet) {
        TicketListItem item = new TicketListItem();
        item.setId(ticket.getId());
        item.setStatus(ticket.getStatus());
        item.setDescription(ticket.getDescription());
        item.setLocation(ticket.getLocation());
        if (ticket.getEnteredDate() != null) {
            item.setEnteredDate(ticket.getEnteredDate().atOffset(ZoneOffset.UTC)
                    .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        }
        if (ticket.getCategory() != null) {
            item.setCategory(new TicketListItem.CategoryRef(
                    ticket.getCategory().getId(),
                    ticket.getCategory().getName()));
        }
        if (ticket.getAssignedPerson() != null) {
            Person p = ticket.getAssignedPerson();
            String name = ((p.getFirstname() != null ? p.getFirstname() : "")
                    + (p.getLastname() != null ? " " + p.getLastname() : "")).trim();
            item.setAssignedPerson(new TicketListItem.PersonRef(p.getId(), name));
        }
        item.setSearchSnippet(searchSnippet);
        return item;
    }

    // -----------------------------------------------------------------------
    // GET
    // -----------------------------------------------------------------------

    /**
     * GET /api/tickets/{id} — return full ticket detail with SLA fields.
     */
    @Transactional(readOnly = true)
    public TicketDetailDto getTicket(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new TicketNotFoundException(id));
        return mapToDto(ticket);
    }

    // -----------------------------------------------------------------------
    // UPDATE (PATCH)
    // -----------------------------------------------------------------------

    /**
     * PATCH /api/tickets/{id} — update mutable fields; generate appropriate history entries.
     */
    public TicketDetailDto updateTicket(Long id, UpdateTicketRequest req, PersonDetails currentUser) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new TicketNotFoundException(id));

        boolean categoryChanged = false;
        boolean locationChanged = false;
        boolean genericChanged = false;

        // Category
        if (req.getCategoryId() != null) {
            Category newCat = categoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new BusinessException("CATEGORY_NOT_FOUND",
                            "Category not found: " + req.getCategoryId()));
            Long oldCatId = ticket.getCategory() != null ? ticket.getCategory().getId() : null;
            if (!req.getCategoryId().equals(oldCatId)) {
                ticket.setCategory(newCat);
                categoryChanged = true;
            }
        }

        // Location
        if (req.getLocation() != null) {
            String oldLoc = ticket.getLocation();
            if (!req.getLocation().equals(oldLoc)) {
                ticket.setLocation(req.getLocation());
                locationChanged = true;
            }
        }

        // Description
        if (req.getDescription() != null) {
            if (!req.getDescription().equals(ticket.getDescription())) {
                ticket.setDescription(req.getDescription());
                genericChanged = true;
            }
        }

        // Lat / Lon
        if (req.getLatitude() != null) {
            ticket.setLatitude(req.getLatitude());
            genericChanged = true;
        }
        if (req.getLongitude() != null) {
            ticket.setLongitude(req.getLongitude());
            genericChanged = true;
        }

        // City / state / zip
        if (req.getCity() != null) { ticket.setCity(req.getCity()); genericChanged = true; }
        if (req.getState() != null) { ticket.setState(req.getState()); genericChanged = true; }
        if (req.getZip() != null) { ticket.setZip(req.getZip()); genericChanged = true; }

        // Assigned person
        if (req.getAssignedPersonId() != null) {
            Ticket ticketRef = ticket;
            personRepository.findById(req.getAssignedPersonId())
                    .ifPresent(p -> ticketRef.setAssignedPerson(p));
            genericChanged = true;
        }

        // Reported by person
        if (req.getReportedByPersonId() != null) {
            personRepository.findById(req.getReportedByPersonId())
                    .ifPresent(ticket::setReportedByPerson);
            genericChanged = true;
        }

        // Issue type
        if (req.getIssueTypeId() != null) {
            issueTypeRepository.findById(req.getIssueTypeId())
                    .ifPresent(ticket::setIssueType);
            genericChanged = true;
        }

        // Contact method
        if (req.getContactMethodId() != null) {
            contactMethodRepository.findById(req.getContactMethodId())
                    .ifPresent(ticket::setContactMethod);
            genericChanged = true;
        }

        // Custom fields
        if (req.getCustomFields() != null) {
            ticket.setCustomFields(serializeCustomFields(req.getCustomFields()));
            genericChanged = true;
        }

        ticket.setLastModified(LocalDateTime.now());
        ticket = ticketRepository.save(ticket);

        // Generate history entries
        if (categoryChanged) {
            createHistoryEntry(ticket, "changeCategory", null, currentUser.getId());
        }
        if (locationChanged) {
            createHistoryEntry(ticket, "changeLocation", null, currentUser.getId());
        }
        if (genericChanged && !categoryChanged && !locationChanged) {
            createHistoryEntry(ticket, "update", null, currentUser.getId());
        } else if (genericChanged) {
            // already created category/location entries; also create update for other changes
            createHistoryEntry(ticket, "update", null, currentUser.getId());
        }

        return mapToDto(ticket);
    }

    // -----------------------------------------------------------------------
    // CLOSE
    // -----------------------------------------------------------------------

    /**
     * POST /api/tickets/{id}/close — close the ticket, record history.
     */
    public TicketDetailDto closeTicket(Long id, CloseTicketRequest req, PersonDetails currentUser) {
        if (req.getSubstatusId() == null) {
            throw new BusinessException("SUBSTATUS_REQUIRED", "substatusId is required");
        }

        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new TicketNotFoundException(id));

        if ("closed".equals(ticket.getStatus())) {
            throw new BusinessException("TICKET_ALREADY_CLOSED",
                    "Ticket is already closed: " + id);
        }

        Substatus substatus = substatusRepository.findById(req.getSubstatusId())
                .orElseThrow(() -> new BusinessException("SUBSTATUS_NOT_FOUND",
                        "Substatus not found: " + req.getSubstatusId()));

        // Duplicate substatus requires parentId
        if ("Duplicate".equalsIgnoreCase(substatus.getName())) {
            if (req.getParentId() == null) {
                throw new BusinessException("PARENT_REQUIRED",
                        "parentId is required when substatus is Duplicate");
            }
            // Validate parent ticket exists (T-04-04)
            if (!ticketRepository.existsById(req.getParentId())) {
                throw new BusinessException("PARENT_NOT_FOUND",
                        "Parent ticket not found: " + req.getParentId());
            }
            ticket.setParentId(req.getParentId());
        }

        ticket.setStatus("closed");
        ticket.setSubstatus(substatus);
        ticket.setClosedDate(LocalDateTime.now());
        ticket.setLastModified(LocalDateTime.now());
        ticket = ticketRepository.save(ticket);

        // Create "closed" history entry
        createHistoryEntry(ticket, "closed", req.getNotes(), currentUser.getId());

        // Additional "duplicate" history entry for duplicate substatus
        if ("Duplicate".equalsIgnoreCase(substatus.getName())) {
            createHistoryEntry(ticket, "duplicate", null, currentUser.getId());
        }

        return mapToDto(ticket);
    }

    // -----------------------------------------------------------------------
    // REOPEN
    // -----------------------------------------------------------------------

    /**
     * POST /api/tickets/{id}/reopen — reopen a closed ticket.
     */
    public TicketDetailDto reopenTicket(Long id, PersonDetails currentUser) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new TicketNotFoundException(id));

        if ("open".equals(ticket.getStatus())) {
            throw new BusinessException("TICKET_NOT_CLOSED",
                    "Ticket is not closed: " + id);
        }

        ticket.setStatus("open");
        ticket.setSubstatus(null);
        ticket.setClosedDate(null);
        ticket.setParentId(null);
        ticket.setLastModified(LocalDateTime.now());
        ticket = ticketRepository.save(ticket);

        createHistoryEntry(ticket, "open", null, currentUser.getId());

        return mapToDto(ticket);
    }

    // -----------------------------------------------------------------------
    // ASSIGN
    // -----------------------------------------------------------------------

    /**
     * POST /api/tickets/{id}/assign — assign ticket to a person.
     */
    public TicketDetailDto assignTicket(Long id, AssignTicketRequest req, PersonDetails currentUser) {
        if (req.getPersonId() == null) {
            throw new BusinessException("PERSON_ID_REQUIRED", "personId is required");
        }

        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new TicketNotFoundException(id));

        Person assignee = personRepository.findById(req.getPersonId())
                .orElseThrow(() -> new BusinessException("PERSON_NOT_FOUND",
                        "Person not found: " + req.getPersonId()));

        ticket.setAssignedPerson(assignee);
        ticket.setLastModified(LocalDateTime.now());
        ticket = ticketRepository.save(ticket);

        createHistoryEntry(ticket, "assignment", req.getNotes(), currentUser.getId());

        return mapToDto(ticket);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Finds a system action by name. Throws IllegalStateException (500) if the
     * action is missing from seed data — all 10 system actions must always be present.
     */
    private Action findActionByName(String name) {
        return actionsRepository.findByName(name)
                .orElseThrow(() -> new IllegalStateException(
                        "Seed action '" + name + "' missing from actions table"));
    }

    /**
     * Creates and persists a TicketHistory entry.
     */
    private TicketHistory createHistoryEntry(Ticket ticket, String actionName,
                                              String notes, Long enteredByPersonId) {
        Action action = findActionByName(actionName);
        TicketHistory history = new TicketHistory();
        history.setTicket(ticket);
        history.setActionId(action.getId());
        history.setEnteredByPersonId(enteredByPersonId);
        history.setEnteredDate(LocalDateTime.now());
        history.setActionDate(LocalDateTime.now());
        history.setNotes(notes);
        return ticketHistoryRepository.save(history);
    }

    /**
     * Maps a Ticket entity to TicketDetailDto, computing SLA fields.
     */
    private TicketDetailDto mapToDto(Ticket ticket) {
        TicketDetailDto dto = new TicketDetailDto();
        dto.setId(ticket.getId());
        dto.setStatus(ticket.getStatus());
        dto.setParentId(ticket.getParentId());
        dto.setDescription(ticket.getDescription());
        dto.setLocation(ticket.getLocation());
        dto.setLatitude(ticket.getLatitude());
        dto.setLongitude(ticket.getLongitude());
        dto.setCity(ticket.getCity());
        dto.setState(ticket.getState());
        dto.setZip(ticket.getZip());

        // Dates as ISO 8601
        if (ticket.getEnteredDate() != null) {
            dto.setEnteredDate(ticket.getEnteredDate().atOffset(ZoneOffset.UTC)
                    .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        }
        if (ticket.getLastModified() != null) {
            dto.setLastModified(ticket.getLastModified().atOffset(ZoneOffset.UTC)
                    .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        }
        if (ticket.getClosedDate() != null) {
            dto.setClosedDate(ticket.getClosedDate().atOffset(ZoneOffset.UTC)
                    .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        }

        // Nested refs
        Category category = ticket.getCategory();
        if (category != null) {
            dto.setCategory(new RefDto(category.getId(), category.getName()));
            if (category.getDepartment() != null) {
                dto.setDepartment(new RefDto(
                        category.getDepartment().getId(),
                        category.getDepartment().getName()));
            }

            // SLA computation
            Integer slaDays = category.getSlaDays();
            if (slaDays != null && slaDays > 0 && ticket.getEnteredDate() != null) {
                Instant slaDue = ticket.getEnteredDate()
                        .toInstant(ZoneOffset.UTC)
                        .plus(slaDays, ChronoUnit.DAYS);
                dto.setSlaDueDate(ISO.format(slaDue));
                boolean overdue = "open".equals(ticket.getStatus())
                        && Instant.now().isAfter(slaDue);
                dto.setIsOverdue(overdue);
            } else {
                dto.setSlaDueDate(null);
                dto.setIsOverdue(false);
            }
        } else {
            dto.setSlaDueDate(null);
            dto.setIsOverdue(false);
        }

        if (ticket.getSubstatus() != null) {
            dto.setSubstatus(new RefDto(ticket.getSubstatus().getId(), ticket.getSubstatus().getName()));
        }
        if (ticket.getAssignedPerson() != null) {
            dto.setAssignedPerson(personRef(ticket.getAssignedPerson()));
        }
        if (ticket.getReportedByPerson() != null) {
            dto.setReportedByPerson(personRef(ticket.getReportedByPerson()));
        }
        if (ticket.getEnteredByPerson() != null) {
            dto.setEnteredByPerson(personRef(ticket.getEnteredByPerson()));
        }
        if (ticket.getContactMethod() != null) {
            dto.setContactMethod(new RefDto(ticket.getContactMethod().getId(),
                    ticket.getContactMethod().getName()));
        }
        if (ticket.getIssueType() != null) {
            dto.setIssueType(new RefDto(ticket.getIssueType().getId(),
                    ticket.getIssueType().getName()));
        }
        if (ticket.getClient() != null) {
            dto.setClient(new RefDto(ticket.getClient().getId(), ticket.getClient().getName()));
        }

        // Media count
        long mediaCount = mediaRepository.countByTicketId(ticket.getId());
        dto.setMediaCount((int) mediaCount);

        // Custom fields — deserialize from JSON string
        if (ticket.getCustomFields() != null) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> fields = objectMapper.readValue(
                        ticket.getCustomFields(), Map.class);
                dto.setCustomFields(fields);
            } catch (JsonProcessingException e) {
                log.warn("Failed to deserialize customFields for ticket {}: {}",
                        ticket.getId(), e.getMessage());
            }
        }

        return dto;
    }

    private RefDto personRef(Person p) {
        if (p == null) return null;
        String name = (p.getFirstname() != null ? p.getFirstname() : "")
                + (p.getLastname() != null ? " " + p.getLastname() : "");
        return new RefDto(p.getId(), name.trim());
    }

    private String serializeCustomFields(Map<String, Object> fields) {
        try {
            return objectMapper.writeValueAsString(fields);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize customFields: {}", e.getMessage());
            return null;
        }
    }
}
