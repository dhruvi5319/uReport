package com.ureport.open311.service;

import com.ureport.domain.*;
import com.ureport.open311.dto.Open311ServiceRequestDto;
import com.ureport.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class Open311RequestService {

    private final TicketRepository ticketRepository;
    private final TicketHistoryRepository ticketHistoryRepository;
    private final MediaRepository mediaRepository;
    private final ClientRepository clientRepository;
    private final CategoryRepository categoryRepository;
    private final PersonRepository personRepository;

    @Value("${app.media.base-url:http://localhost:8080/media}")
    private String mediaBaseUrl;

    public Open311RequestService(TicketRepository ticketRepository,
                                  TicketHistoryRepository ticketHistoryRepository,
                                  MediaRepository mediaRepository,
                                  ClientRepository clientRepository,
                                  CategoryRepository categoryRepository,
                                  PersonRepository personRepository) {
        this.ticketRepository = ticketRepository;
        this.ticketHistoryRepository = ticketHistoryRepository;
        this.mediaRepository = mediaRepository;
        this.clientRepository = clientRepository;
        this.categoryRepository = categoryRepository;
        this.personRepository = personRepository;
    }

    /**
     * GET /open311/v2/requests — returns paginated list filtered by params.
     * All filter params are optional. Defaults: page=1, page_size=1000.
     */
    public List<Open311ServiceRequestDto> findRequests(Map<String, String> params) {
        int pageSize = parsePageSize(params.getOrDefault("page_size", "1000"));
        int page = parsePage(params.getOrDefault("page", "1"));

        Specification<Ticket> spec = buildSpecification(params);
        var pageable = PageRequest.of(page - 1, pageSize);
        return ticketRepository.findAll(spec, pageable).stream()
            .map(this::toServiceRequestDto)
            .collect(Collectors.toList());
    }

    /**
     * GET /open311/v2/requests/{id} — returns single service request.
     * Returns 404 if not found.
     */
    public Open311ServiceRequestDto findRequest(Long id) {
        return ticketRepository.findById(id)
            .map(this::toServiceRequestDto)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Service request not found"));
    }

    /**
     * POST /open311/v2/requests — creates a new ticket.
     * Validates api_key, maps Open311 fields to internal ticket fields.
     * Media upload errors are silently ignored.
     * Returns HTTP 200 (not 201) per PHP reference behavior.
     */
    @Transactional
    public Open311ServiceRequestDto createRequest(Map<String, String> params,
                                                   String apiKey,
                                                   MultipartFile mediaFile) {
        // 1. Validate api_key — 403 if missing or invalid
        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "An api_key is required");
        }
        clientRepository.findByApiKey(apiKey)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Invalid API key"));

        // 2. Validate service_code (category_id) — 400 if unknown
        String serviceCode = params.get("service_code");
        if (serviceCode == null || serviceCode.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "service_code is required");
        }
        Long categoryId;
        try {
            categoryId = Long.parseLong(serviceCode);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Invalid service_code");
        }
        Category category = categoryRepository.findById(categoryId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Unknown service_code: " + serviceCode));

        // 3. Find or create reporter Person from email / account_id / name+phone
        Person reporter = resolveReporter(params);

        // 4. Build Ticket from Open311 field mapping (TechArch spec)
        Ticket ticket = new Ticket();
        ticket.setCategory(category);
        ticket.setReportedByPerson(reporter);
        ticket.setDescription(params.getOrDefault("description", ""));
        ticket.setLocation(params.getOrDefault("address_string", ""));
        ticket.setStatus("open");

        String latStr = params.get("lat");
        String lonStr = params.get("long");
        if (latStr != null && !latStr.isBlank()) {
            try { ticket.setLatitude(Double.parseDouble(latStr)); } catch (NumberFormatException ignored) {}
        }
        if (lonStr != null && !lonStr.isBlank()) {
            try { ticket.setLongitude(Double.parseDouble(lonStr)); } catch (NumberFormatException ignored) {}
        }

        ticket.setEnteredDate(LocalDateTime.now());
        ticket.setLastModified(LocalDateTime.now());

        Ticket saved = ticketRepository.save(ticket);

        // 5. Attach media — silently ignore errors per TechArch spec
        if (mediaFile != null && !mediaFile.isEmpty()) {
            try {
                Media media = new Media();
                media.setTicket(saved);
                media.setFilename(mediaFile.getOriginalFilename());
                media.setMimeType(mediaFile.getContentType());
                media.setUploaded(LocalDateTime.now());
                mediaRepository.save(media);
            } catch (Exception ignored) {
                // Media upload errors silently ignored — ticket is still created
            }
        }

        return toServiceRequestDto(saved);
    }

    /**
     * Maps Ticket entity to Open311ServiceRequestDto with all 18 GeoReport v2 fields.
     */
    public Open311ServiceRequestDto toServiceRequestDto(Ticket ticket) {
        var dto = new Open311ServiceRequestDto();
        dto.setServiceRequestId(ticket.getId().toString());
        dto.setStatus(ticket.getStatus() != null ? ticket.getStatus() : "open");

        // status_notes from latest ticket_history notes
        var history = ticketHistoryRepository.findByTicketIdOrderByEnteredDateDesc(ticket.getId());
        dto.setStatusNotes(history.isEmpty() ? "" : (history.get(0).getNotes() != null ? history.get(0).getNotes() : ""));

        if (ticket.getCategory() != null) {
            dto.setServiceName(ticket.getCategory().getName());
            dto.setServiceCode(ticket.getCategory().getId().toString());
            // agency_responsible from department
            if (ticket.getCategory().getDepartment() != null) {
                dto.setAgencyResponsible(ticket.getCategory().getDepartment().getName());
            } else {
                dto.setAgencyResponsible("");
            }
        } else {
            dto.setServiceName("");
            dto.setServiceCode("");
            dto.setAgencyResponsible("");
        }

        dto.setDescription(ticket.getDescription() != null ? ticket.getDescription() : "");
        dto.setServiceNotice("");

        // ISO 8601 datetimes
        DateTimeFormatter iso = DateTimeFormatter.ISO_DATE_TIME;
        dto.setRequestedDatetime(ticket.getEnteredDate() != null
            ? ticket.getEnteredDate().format(iso) : null);
        dto.setUpdatedDatetime(ticket.getLastModified() != null
            ? ticket.getLastModified().format(iso) : null);

        // expected_datetime = entered_date + sla_days (if category has sla_days)
        if (ticket.getEnteredDate() != null
            && ticket.getCategory() != null
            && ticket.getCategory().getSlaDays() != null
            && ticket.getCategory().getSlaDays() > 0) {
            dto.setExpectedDatetime(
                ticket.getEnteredDate().plusDays(ticket.getCategory().getSlaDays()).format(iso));
        } else {
            dto.setExpectedDatetime(null);
        }

        dto.setAddress(ticket.getLocation() != null ? ticket.getLocation() : "");
        dto.setAddressId(ticket.getAddressId() != null ? ticket.getAddressId() : "");
        dto.setZipcode(ticket.getZip() != null ? ticket.getZip() : "");
        dto.setLat(ticket.getLatitude());
        dto.setLon(ticket.getLongitude());

        // media_url: URL of first media attachment or ""
        var media = mediaRepository.findByTicketIdOrderByUploadedAsc(ticket.getId());
        if (!media.isEmpty() && media.get(0).getFilename() != null) {
            dto.setMediaUrl(mediaBaseUrl + "/" + ticket.getId() + "/" + media.get(0).getFilename());
        } else {
            dto.setMediaUrl("");
        }

        return dto;
    }

    // --- Private helpers ---

    private Specification<Ticket> buildSpecification(Map<String, String> params) {
        return (root, query, cb) -> {
            var predicates = new ArrayList<Predicate>();

            if (params.containsKey("service_code")) {
                try {
                    Long catId = Long.parseLong(params.get("service_code"));
                    predicates.add(cb.equal(root.get("category").get("id"), catId));
                } catch (NumberFormatException e) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid service_code");
                }
            }

            if (params.containsKey("status")) {
                predicates.add(cb.equal(root.get("status"), params.get("status")));
            }

            if (params.containsKey("start_date")) {
                LocalDateTime dt = parseIso8601(params.get("start_date"), "start_date");
                predicates.add(cb.greaterThanOrEqualTo(root.get("enteredDate"), dt));
            }

            if (params.containsKey("end_date")) {
                LocalDateTime dt = parseIso8601(params.get("end_date"), "end_date");
                predicates.add(cb.lessThanOrEqualTo(root.get("enteredDate"), dt));
            }

            if (params.containsKey("updated_after")) {
                LocalDateTime dt = parseIso8601(params.get("updated_after"), "updated_after");
                predicates.add(cb.greaterThanOrEqualTo(root.get("lastModified"), dt));
            }

            if (params.containsKey("updated_before")) {
                LocalDateTime dt = parseIso8601(params.get("updated_before"), "updated_before");
                predicates.add(cb.lessThanOrEqualTo(root.get("lastModified"), dt));
            }

            if (params.containsKey("bbox")) {
                // bbox format: lat_lo,lng_lo,lat_hi,lng_hi
                String[] parts = params.get("bbox").split(",");
                if (parts.length == 4) {
                    try {
                        double latLo = Double.parseDouble(parts[0].trim());
                        double lngLo = Double.parseDouble(parts[1].trim());
                        double latHi = Double.parseDouble(parts[2].trim());
                        double lngHi = Double.parseDouble(parts[3].trim());
                        predicates.add(cb.between(root.get("latitude"), latLo, latHi));
                        predicates.add(cb.between(root.get("longitude"), lngLo, lngHi));
                    } catch (NumberFormatException e) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Malformed bbox parameter");
                    }
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private LocalDateTime parseIso8601(String value, String paramName) {
        try {
            return LocalDateTime.parse(value, DateTimeFormatter.ISO_DATE_TIME);
        } catch (DateTimeParseException e) {
            // Try ISO_DATE (date only, no time)
            try {
                return LocalDate.parse(value).atStartOfDay();
            } catch (DateTimeParseException e2) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Malformed date parameter: " + paramName);
            }
        }
    }

    private int parsePageSize(String value) {
        try {
            int v = Integer.parseInt(value);
            return v <= 0 ? 1000 : v;
        } catch (NumberFormatException e) {
            return 1000;
        }
    }

    private int parsePage(String value) {
        try {
            int v = Integer.parseInt(value);
            return v <= 0 ? 1 : v;
        } catch (NumberFormatException e) {
            return 1;
        }
    }

    /**
     * Resolves reporter Person from POST params.
     * Priority: account_id → email lookup → create new Person.
     */
    private Person resolveReporter(Map<String, String> params) {
        // account_id → direct lookup by person ID
        if (params.containsKey("account_id") && !params.get("account_id").isBlank()) {
            try {
                Long personId = Long.parseLong(params.get("account_id"));
                return personRepository.findById(personId).orElse(null);
            } catch (NumberFormatException ignored) {}
        }

        // email → find existing person
        String email = params.get("email");
        if (email != null && !email.isBlank()) {
            var existing = personRepository.findByEmail(email);
            if (existing.isPresent()) return existing.get();
        }

        // Create new anonymous person from submitted fields
        Person person = new Person();
        person.setFirstname(params.getOrDefault("first_name", ""));
        person.setLastname(params.getOrDefault("last_name", ""));
        return personRepository.save(person);
    }
}
