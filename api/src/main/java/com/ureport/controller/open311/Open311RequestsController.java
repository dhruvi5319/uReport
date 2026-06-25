package com.ureport.controller.open311;

import com.ureport.dto.request.CreateTicketRequest;
import com.ureport.dto.response.Open311PostResponse;
import com.ureport.dto.response.Open311RequestResponse;
import com.ureport.entity.*;
import com.ureport.exception.NotFoundException;
import com.ureport.repository.*;
import com.ureport.service.Open311MappingService;
import com.ureport.service.Open311XmlSerializer;
import com.ureport.service.TicketService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Open311 GeoReport v2 Requests endpoints:
 * POST /open311/requests  — create service request
 * GET  /open311/requests  — list/filter service requests
 * GET  /open311/requests/{service_request_id} — get single request
 *
 * api_key validation is handled by ApiKeyAuthenticationFilter (POST only).
 */
@RestController
public class Open311RequestsController {

    @Value("${app.open311.obsoleteApiKeys:}")
    private String obsoleteApiKeysConfig;

    @Value("${app.open311.obsoleteMessage:This API key is no longer valid.}")
    private String obsoleteMessage;

    private final TicketRepository ticketRepository;
    private final CategoryRepository categoryRepository;
    private final SubstatusRepository substatusRepository;
    private final PersonRepository personRepository;
    private final PeopleEmailRepository peopleEmailRepository;
    private final MediaRepository mediaRepository;
    private final Open311MappingService mappingService;
    private final Open311XmlSerializer xmlSerializer;
    private final TicketService ticketService;

    public Open311RequestsController(TicketRepository ticketRepository,
                                     CategoryRepository categoryRepository,
                                     SubstatusRepository substatusRepository,
                                     PersonRepository personRepository,
                                     PeopleEmailRepository peopleEmailRepository,
                                     MediaRepository mediaRepository,
                                     Open311MappingService mappingService,
                                     Open311XmlSerializer xmlSerializer,
                                     TicketService ticketService) {
        this.ticketRepository = ticketRepository;
        this.categoryRepository = categoryRepository;
        this.substatusRepository = substatusRepository;
        this.personRepository = personRepository;
        this.peopleEmailRepository = peopleEmailRepository;
        this.mediaRepository = mediaRepository;
        this.mappingService = mappingService;
        this.xmlSerializer = xmlSerializer;
        this.ticketService = ticketService;
    }

    /**
     * POST /open311/requests
     * Creates a new service request. Requires valid api_key.
     * Authentication: ApiKeyAuthenticationFilter performs SHA-256 hash of api_key → lookup in
     * clients.api_key_lookup column → BCrypt verify against clients.api_key_hash.
     * Obsolete keys: checked against app.open311.obsoleteApiKeys config list; obsolete api_key
     * causes filter to set request attribute "obsoleteApiKey=true" without 403-ing the request.
     * If api_key is obsolete, returns 200 {shutdown: true, message: ...} (no ticket created).
     */
    @PostMapping("/open311/requests")
    public ResponseEntity<?> createRequest(
            @RequestParam(value = "api_key", required = false) String apiKey,
            @RequestParam(value = "service_code") String serviceCode,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "lat", required = false) String latStr,
            @RequestParam(value = "long", required = false) String lngStr,
            @RequestParam(value = "address_string", required = false) String addressString,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "first_name", required = false) String firstName,
            @RequestParam(value = "last_name", required = false) String lastName,
            @RequestParam(value = "phone", required = false) String phone,
            @RequestParam(value = "format", required = false) String format,
            HttpServletRequest request) {

        // Check if this is an obsolete api_key request (set by ApiKeyAuthenticationFilter)
        Boolean isObsolete = (Boolean) request.getAttribute("obsoleteApiKey");
        if (Boolean.TRUE.equals(isObsolete)) {
            Map<String, Object> shutdownResponse = new LinkedHashMap<>();
            shutdownResponse.put("shutdown", true);
            shutdownResponse.put("message", obsoleteMessage);
            return ResponseEntity.ok(shutdownResponse);
        }

        // Resolve service_code to Category
        int categoryId;
        try {
            categoryId = Integer.parseInt(serviceCode);
        } catch (NumberFormatException e) {
            return ResponseEntity.status(422)
                    .body(Map.of("error", "INVALID_SERVICE_CODE",
                            "message", "Invalid service_code: " + serviceCode));
        }

        Category category = categoryRepository.findById(categoryId)
                .filter(c -> Boolean.TRUE.equals(c.getActive()))
                .orElse(null);
        if (category == null) {
            return ResponseEntity.status(404)
                    .body(Map.of("error", "SERVICE_NOT_FOUND",
                            "message", "Service not found: " + serviceCode));
        }

        // Validate posting permission
        if (!"public".equals(category.getPostingPermissionLevel())
                && !"anonymous".equals(category.getPostingPermissionLevel())) {
            return ResponseEntity.status(403)
                    .body(Map.of("error", "PERMISSION_DENIED",
                            "message", "This service does not accept public submissions"));
        }

        // Find or create person from email/name
        Integer reportedByPersonId = null;
        if (email != null && !email.isBlank()) {
            Optional<PeopleEmail> emailRecord = peopleEmailRepository.findFirstByEmail(email);
            if (emailRecord.isPresent()) {
                reportedByPersonId = emailRecord.get().getPersonId();
            } else if (firstName != null && lastName != null) {
                Person reporter = new Person();
                reporter.setFirstname(firstName);
                reporter.setLastname(lastName);
                reporter.setRole("public");
                final Person savedReporter = personRepository.save(reporter);
                PeopleEmail newEmail = new PeopleEmail();
                newEmail.setPerson(savedReporter);
                newEmail.setEmail(email);
                newEmail.setUsedForNotifications(true);
                peopleEmailRepository.save(newEmail);
                reportedByPersonId = savedReporter.getId();
            }
        }

        // Parse coordinates
        java.math.BigDecimal lat = null;
        java.math.BigDecimal lng = null;
        try {
            if (latStr != null && !latStr.isBlank()) lat = new java.math.BigDecimal(latStr);
            if (lngStr != null && !lngStr.isBlank()) lng = new java.math.BigDecimal(lngStr);
        } catch (NumberFormatException e) {
            return ResponseEntity.status(422)
                    .body(Map.of("error", "INVALID_COORDINATES",
                            "message", "Invalid lat/long values"));
        }

        // Build CreateTicketRequest
        final Integer finalReportedByPersonId = reportedByPersonId;
        final java.math.BigDecimal finalLat = lat;
        final java.math.BigDecimal finalLng = lng;
        CreateTicketRequest createReq = new CreateTicketRequest(
                categoryId,
                description != null ? description : "",
                null,           // issueTypeId
                null,           // contactMethodId
                null,           // responseMethodId
                finalReportedByPersonId,
                null,           // reporterEmail — already resolved above
                firstName,
                lastName,
                addressString,
                null,           // city
                null,           // state
                null,           // zip
                finalLat,
                finalLng,
                null,           // addressId
                null,           // additionalFields
                null            // customFields
        );

        // Create ticket — enteredByPersonId=null (API-submitted), callerRole=anonymous
        Ticket ticket = ticketService.createTicket(createReq, null, "anonymous");

        Open311PostResponse postResponse = new Open311PostResponse(String.valueOf(ticket.getId()));

        if ("xml".equals(format)) {
            String xml = xmlSerializer.serializePostResponse(postResponse);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_XML)
                    .body(xml);
        }

        return ResponseEntity.ok(List.of(postResponse));
    }

    /**
     * GET /open311/requests
     * Filter params: service_request_id, service_code, status, start_date, end_date,
     *                lat, long, radius, keyword, page, per_page (default 50, max 200)
     */
    @GetMapping("/open311/requests")
    public ResponseEntity<?> listRequests(
            @RequestParam(value = "service_request_id", required = false) String serviceRequestId,
            @RequestParam(value = "service_code", required = false) String serviceCode,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "start_date", required = false) String startDate,
            @RequestParam(value = "end_date", required = false) String endDate,
            @RequestParam(value = "lat", required = false) String latStr,
            @RequestParam(value = "long", required = false) String lngStr,
            @RequestParam(value = "radius", required = false) Integer radius,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "per_page", defaultValue = "50") int perPage,
            @RequestParam(value = "format", required = false) String format) {

        // Clamp per_page
        perPage = Math.min(Math.max(perPage, 1), 200);
        int offset = (page - 1) * perPage;

        // Build list (use basic repository for now; full FTS is in TicketSearchService)
        List<Ticket> tickets = ticketRepository.findAll(
                PageRequest.of(page - 1, perPage)).getContent();

        // Apply simple filters
        if (serviceRequestId != null) {
            try {
                long id = Long.parseLong(serviceRequestId);
                tickets = tickets.stream().filter(t -> id == t.getId()).collect(Collectors.toList());
            } catch (NumberFormatException ignored) {
                tickets = List.of();
            }
        }
        if (serviceCode != null) {
            try {
                int catId = Integer.parseInt(serviceCode);
                tickets = tickets.stream().filter(t -> catId == t.getCategoryId()).collect(Collectors.toList());
            } catch (NumberFormatException ignored) {
                tickets = List.of();
            }
        }
        if (status != null) {
            String s = status;
            tickets = tickets.stream().filter(t -> s.equals(t.getStatus())).collect(Collectors.toList());
        }
        if (startDate != null) {
            try {
                OffsetDateTime start = OffsetDateTime.parse(startDate, DateTimeFormatter.ISO_OFFSET_DATE_TIME);
                tickets = tickets.stream()
                        .filter(t -> t.getEnteredDate() != null && !t.getEnteredDate().isBefore(start))
                        .collect(Collectors.toList());
            } catch (Exception ignored) {}
        }
        if (endDate != null) {
            try {
                OffsetDateTime end = OffsetDateTime.parse(endDate, DateTimeFormatter.ISO_OFFSET_DATE_TIME);
                tickets = tickets.stream()
                        .filter(t -> t.getEnteredDate() != null && !t.getEnteredDate().isAfter(end))
                        .collect(Collectors.toList());
            } catch (Exception ignored) {}
        }

        List<Open311RequestResponse> responses = mapTicketsToRequests(tickets);

        if ("xml".equals(format)) {
            String xml = xmlSerializer.serializeRequests(responses);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_XML)
                    .body(xml);
        }

        return ResponseEntity.ok(responses);
    }

    /**
     * GET /open311/requests/{service_request_id}
     * Returns single request as a single-element array per GeoReport v2 spec.
     */
    @GetMapping("/open311/requests/{service_request_id}")
    public ResponseEntity<?> getRequest(
            @PathVariable("service_request_id") String serviceRequestId,
            @RequestParam(value = "format", required = false) String format) {

        long id;
        try {
            id = Long.parseLong(serviceRequestId);
        } catch (NumberFormatException e) {
            return ResponseEntity.status(404)
                    .body(Map.of("error", "REQUEST_NOT_FOUND"));
        }

        Optional<Ticket> ticketOpt = ticketRepository.findById(id);
        if (ticketOpt.isEmpty()) {
            return ResponseEntity.status(404)
                    .body(Map.of("error", "REQUEST_NOT_FOUND"));
        }

        Ticket ticket = ticketOpt.get();
        List<Open311RequestResponse> responses = mapTicketsToRequests(List.of(ticket));

        if ("xml".equals(format)) {
            String xml = xmlSerializer.serializeRequests(responses);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_XML)
                    .body(xml);
        }

        return ResponseEntity.ok(responses);
    }

    // Helper — maps tickets to Open311RequestResponse list
    private List<Open311RequestResponse> mapTicketsToRequests(List<Ticket> tickets) {
        List<Open311RequestResponse> responses = new ArrayList<>();
        for (Ticket ticket : tickets) {
            Category category = categoryRepository.findById(ticket.getCategoryId()).orElse(null);
            if (category == null) continue;

            Substatus substatus = ticket.getSubstatusId() != null
                    ? substatusRepository.findById(ticket.getSubstatusId()).orElse(null)
                    : null;

            Person assignedPerson = ticket.getAssignedPersonId() != null
                    ? personRepository.findById(ticket.getAssignedPersonId()).orElse(null)
                    : null;

            Media firstMedia = mediaRepository.findFirstByTicketIdOrderByIdAsc(ticket.getId()).orElse(null);

            responses.add(mappingService.toServiceRequest(ticket, category, substatus, assignedPerson, firstMedia));
        }
        return responses;
    }
}
