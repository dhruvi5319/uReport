package com.ureport.crm.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ureport.crm.dto.LogActionRequest;
import com.ureport.crm.dto.TicketDetailDto.RefDto;
import com.ureport.crm.dto.TicketHistoryEntryDto;
import com.ureport.crm.exception.BusinessException;
import com.ureport.crm.exception.TicketNotFoundException;
import com.ureport.domain.Action;
import com.ureport.domain.CategoryActionResponse;
import com.ureport.domain.Ticket;
import com.ureport.domain.TicketHistory;
import com.ureport.repository.ActionsRepository;
import com.ureport.repository.CategoryActionResponseRepository;
import com.ureport.repository.DepartmentActionRepository;
import com.ureport.repository.PersonRepository;
import com.ureport.repository.TicketHistoryRepository;
import com.ureport.repository.TicketRepository;
import com.ureport.security.PersonDetails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

/**
 * Service for action/response logging on tickets.
 *
 * logAction() enforces:
 * - Ticket existence (404)
 * - Action existence (400)
 * - "response" action requires notes (400 NOTES_REQUIRED)
 * - STAFF users restricted to department_actions list (403 DEPARTMENT_ACTION_FORBIDDEN)
 * - ADMIN users bypass department filter (T-04-12)
 * - actionPersonId validated (400 if invalid) (T-04-13)
 * - Email failure is non-fatal (T-04-15)
 *
 * getTimeline() returns entries sorted by entered_date DESC.
 * getResponseTemplate() returns CAR.template → Action.template → null.
 */
@Service
@Transactional
public class TicketHistoryService {

    private static final Logger log = LoggerFactory.getLogger(TicketHistoryService.class);
    private static final DateTimeFormatter ISO = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'")
            .withZone(ZoneOffset.UTC);

    private final TicketRepository ticketRepository;
    private final TicketHistoryRepository ticketHistoryRepository;
    private final ActionsRepository actionsRepository;
    private final DepartmentActionRepository departmentActionRepository;
    private final CategoryActionResponseRepository categoryActionResponseRepository;
    private final PersonRepository personRepository;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    public TicketHistoryService(TicketRepository ticketRepository,
                                 TicketHistoryRepository ticketHistoryRepository,
                                 ActionsRepository actionsRepository,
                                 DepartmentActionRepository departmentActionRepository,
                                 CategoryActionResponseRepository categoryActionResponseRepository,
                                 PersonRepository personRepository,
                                 NotificationService notificationService,
                                 ObjectMapper objectMapper) {
        this.ticketRepository = ticketRepository;
        this.ticketHistoryRepository = ticketHistoryRepository;
        this.actionsRepository = actionsRepository;
        this.departmentActionRepository = departmentActionRepository;
        this.categoryActionResponseRepository = categoryActionResponseRepository;
        this.personRepository = personRepository;
        this.notificationService = notificationService;
        this.objectMapper = objectMapper;
    }

    /**
     * Logs an action on a ticket, optionally sending email notifications.
     *
     * @param ticketId    the ticket to log the action on
     * @param req         the action request (actionId, notes, notifyFlags, actionPersonId)
     * @param currentUser the authenticated user performing the action
     * @return the created TicketHistoryEntryDto
     */
    public TicketHistoryEntryDto logAction(Long ticketId, LogActionRequest req, PersonDetails currentUser) {
        // Step 1: Validate ticket exists
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));

        // Step 2: Validate action exists
        if (req.getActionId() == null) {
            throw new BusinessException("ACTION_NOT_FOUND", "actionId is required");
        }
        Action action = actionsRepository.findById(req.getActionId())
                .orElseThrow(() -> new BusinessException("ACTION_NOT_FOUND",
                        "Action not found: " + req.getActionId()));

        // Step 3: Validate "response" requires notes
        if ("response".equalsIgnoreCase(action.getName())
                && (req.getNotes() == null || req.getNotes().isBlank())) {
            throw new BusinessException("NOTES_REQUIRED",
                    "Notes are required when action is 'response'");
        }

        // Step 4: Department filter — enforced for STAFF; bypassed for ADMIN (T-04-12)
        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            // Get department from category
            Long departmentId = null;
            if (ticket.getCategory() != null && ticket.getCategory().getDepartment() != null) {
                departmentId = ticket.getCategory().getDepartment().getId();
            }
            if (departmentId == null || !departmentActionRepository.existsByDepartmentIdAndActionId(
                    departmentId, req.getActionId())) {
                throw new BusinessException("DEPARTMENT_ACTION_FORBIDDEN",
                        "Action is not permitted for this department",
                        HttpStatus.FORBIDDEN);
            }
        }

        // Step 4b: Validate actionPersonId if provided (T-04-13)
        Long resolvedActionPersonId;
        if (req.getActionPersonId() != null) {
            personRepository.findById(req.getActionPersonId())
                    .orElseThrow(() -> new BusinessException("PERSON_NOT_FOUND",
                            "actionPersonId not found: " + req.getActionPersonId()));
            resolvedActionPersonId = req.getActionPersonId();
        } else {
            resolvedActionPersonId = currentUser.getId();
        }

        // Step 5: Build TicketHistory
        TicketHistory history = new TicketHistory();
        history.setTicket(ticket);
        history.setActionId(req.getActionId());
        history.setEnteredByPersonId(currentUser.getId());
        history.setActionPersonId(resolvedActionPersonId);
        history.setEnteredDate(LocalDateTime.now());
        history.setActionDate(LocalDateTime.now());
        history.setNotes(req.getNotes());

        // Step 6: Send notifications (non-fatal — T-04-15)
        boolean notifyReporter = Boolean.TRUE.equals(req.getNotifyReporter());
        boolean notifyAssignee = Boolean.TRUE.equals(req.getNotifyAssignee());
        List<String> sentTo = notificationService.sendTicketNotification(
                ticketId, history, notifyReporter, notifyAssignee);

        // Step 7: Persist sentNotifications as JSON array
        try {
            history.setSentNotifications(objectMapper.writeValueAsString(sentTo));
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize sentNotifications: {}", e.getMessage());
            history.setSentNotifications("[]");
        }

        // Step 8: Save history entry
        history = ticketHistoryRepository.save(history);

        // Step 9: Return DTO
        return toDto(history, action);
    }

    /**
     * Returns all history entries for a ticket, sorted by entered_date DESC.
     */
    @Transactional(readOnly = true)
    public List<TicketHistoryEntryDto> getTimeline(Long ticketId) {
        // Validate ticket exists first
        ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));

        return ticketHistoryRepository.findByTicketIdOrderByEnteredDateDesc(ticketId)
                .stream()
                .map(h -> {
                    Action action = h.getActionId() != null
                            ? actionsRepository.findById(h.getActionId()).orElse(null)
                            : null;
                    return toDto(h, action);
                })
                .toList();
    }

    /**
     * Returns the response template for a category+action pair.
     * Priority: CategoryActionResponse.template → Action.template → null
     */
    @Transactional(readOnly = true)
    public String getResponseTemplate(Long categoryId, Long actionId) {
        if (categoryId != null && actionId != null) {
            Optional<CategoryActionResponse> car =
                    categoryActionResponseRepository.findByCategoryIdAndActionId(categoryId, actionId);
            if (car.isPresent() && car.get().getTemplate() != null && !car.get().getTemplate().isBlank()) {
                return car.get().getTemplate();
            }
        }
        if (actionId != null) {
            Optional<Action> action = actionsRepository.findById(actionId);
            if (action.isPresent() && action.get().getTemplate() != null && !action.get().getTemplate().isBlank()) {
                return action.get().getTemplate();
            }
        }
        return null;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private TicketHistoryEntryDto toDto(TicketHistory h, Action action) {
        TicketHistoryEntryDto dto = new TicketHistoryEntryDto();
        dto.setId(h.getId());
        dto.setTicketId(h.getTicket() != null ? h.getTicket().getId() : null);
        dto.setActionName(action != null ? action.getName() : null);
        dto.setNotes(h.getNotes());
        dto.setSentNotifications(h.getSentNotifications());

        if (h.getEnteredDate() != null) {
            dto.setEnteredDate(ISO.format(h.getEnteredDate().toInstant(ZoneOffset.UTC)));
        }
        if (h.getActionDate() != null) {
            dto.setActionDate(ISO.format(h.getActionDate().toInstant(ZoneOffset.UTC)));
        }

        // enteredByPerson — load by ID for display
        if (h.getEnteredByPersonId() != null) {
            personRepository.findById(h.getEnteredByPersonId()).ifPresent(p ->
                    dto.setEnteredByPerson(new RefDto(p.getId(),
                            p.getFirstname() + " " + p.getLastname())));
        }

        // actionPerson — load by ID for display
        if (h.getActionPersonId() != null) {
            personRepository.findById(h.getActionPersonId()).ifPresent(p ->
                    dto.setActionPerson(new RefDto(p.getId(),
                            p.getFirstname() + " " + p.getLastname())));
        }

        return dto;
    }
}
