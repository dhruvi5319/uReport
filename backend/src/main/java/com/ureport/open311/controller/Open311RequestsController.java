package com.ureport.open311.controller;

import com.ureport.open311.dto.Open311ErrorDto;
import com.ureport.open311.dto.Open311ServiceRequestDto;
import com.ureport.open311.service.Open311RequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/open311/v2")
@Tag(name = "Open311 Requests", description = "GeoReport v2 service request endpoints")
@SecurityRequirement(name = "bearerAuth")
public class Open311RequestsController {

    private final Open311RequestService requestService;

    public Open311RequestsController(Open311RequestService requestService) {
        this.requestService = requestService;
    }

    /**
     * GET /open311/v2/requests
     * GET /open311/v2/requests.json
     * GET /open311/v2/requests.xml
     *
     * Filter params: service_code, status, start_date, end_date,
     *   updated_before, updated_after, bbox, page_size, page
     */
    @GetMapping(
        value = {"/requests", "/requests.{ext}"},
        produces = {MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE}
    )
    @Operation(summary = "List service requests",
        description = "Returns paginated service requests filtered by service_code, status, date range, or bounding box")
    @Parameter(name = "service_code", description = "Filter by service category id")
    @Parameter(name = "status", description = "Filter by status: open or closed")
    @Parameter(name = "start_date", description = "Filter entered_date >= (ISO 8601, e.g. 2024-01-01T00:00:00)")
    @Parameter(name = "end_date", description = "Filter entered_date <= (ISO 8601)")
    @Parameter(name = "updated_before", description = "Filter last_modified <= (ISO 8601)")
    @Parameter(name = "updated_after", description = "Filter last_modified >= (ISO 8601)")
    @Parameter(name = "bbox", description = "Spatial bounding box: lat_lo,lng_lo,lat_hi,lng_hi")
    @Parameter(name = "page_size", description = "Results per page (default 1000; 0 treated as 1000)")
    @Parameter(name = "page", description = "Page number, 1-based (default 1; 0 treated as 1)")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Array of Open311 service request objects"),
        @ApiResponse(responseCode = "400", description = "Malformed filter parameter"),
    })
    public ResponseEntity<?> getRequests(
        @RequestParam Map<String, String> allParams,
        @PathVariable(name = "ext", required = false) String ext
    ) {
        String formatParam = allParams.get("format");
        List<Open311ServiceRequestDto> requests = requestService.findRequests(allParams);
        MediaType responseType = resolveMediaType(ext, formatParam);
        if (responseType != null) {
            return ResponseEntity.ok().contentType(responseType).body(requests);
        }
        return ResponseEntity.ok(requests);
    }

    /**
     * GET /open311/v2/requests/{service_request_id}
     * GET /open311/v2/requests/{service_request_id}.json
     * GET /open311/v2/requests/{service_request_id}.xml
     */
    @GetMapping(
        value = {"/requests/{id}", "/requests/{id}.{ext}"},
        produces = {MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE}
    )
    @Operation(summary = "Get service request by id",
        description = "Returns a single service request by service_request_id")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Single Open311 service request object"),
        @ApiResponse(responseCode = "404", description = "Service request not found"),
    })
    public ResponseEntity<?> getRequest(
        @PathVariable String id,
        @RequestParam(name = "format", required = false) String formatParam,
        @PathVariable(name = "ext", required = false) String ext
    ) {
        Long ticketId;
        try {
            ticketId = Long.parseLong(id);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND,
                "Service request not found");
        }
        Open311ServiceRequestDto request = requestService.findRequest(ticketId);
        MediaType responseType = resolveMediaType(ext, formatParam);
        if (responseType != null) {
            return ResponseEntity.ok().contentType(responseType).body(request);
        }
        return ResponseEntity.ok(request);
    }

    /**
     * POST /open311/v2/requests
     *
     * Accepts application/x-www-form-urlencoded or multipart/form-data.
     * Returns HTTP 200 (not 201) with [{service_request_id: "N"}] per PHP behavior.
     * Required: api_key. Without valid api_key → 403.
     */
    @PostMapping(
        value = "/requests",
        consumes = {MediaType.APPLICATION_FORM_URLENCODED_VALUE, MediaType.MULTIPART_FORM_DATA_VALUE},
        produces = {MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE}
    )
    @Operation(summary = "Create a service request",
        description = "Creates a new service request (ticket). Requires a valid api_key. Returns HTTP 200 with [{service_request_id}] array.")
    @Parameter(name = "api_key", description = "Open311 client API key — REQUIRED", required = true)
    @Parameter(name = "service_code", description = "Category id — REQUIRED", required = true)
    @Parameter(name = "lat", description = "Latitude of the issue location")
    @Parameter(name = "long", description = "Longitude of the issue location")
    @Parameter(name = "address_string", description = "Human-readable address")
    @Parameter(name = "description", description = "Description of the issue")
    @Parameter(name = "first_name", description = "Reporter first name")
    @Parameter(name = "last_name", description = "Reporter last name")
    @Parameter(name = "email", description = "Reporter email (used to find/create person)")
    @Parameter(name = "phone", description = "Reporter phone")
    @Parameter(name = "media", description = "Optional photo attachment (multipart)")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Array containing the created service_request_id"),
        @ApiResponse(responseCode = "400", description = "Unknown service_code"),
        @ApiResponse(responseCode = "403", description = "Missing or invalid api_key"),
    })
    public ResponseEntity<?> createRequest(
        @RequestParam Map<String, String> params,
        @RequestParam(name = "media", required = false) MultipartFile mediaFile
    ) {
        String apiKey = params.get("api_key");
        Open311ServiceRequestDto created = requestService.createRequest(params, apiKey, mediaFile);
        // Return HTTP 200 (not 201) with array per PHP reference behavior
        return ResponseEntity.ok(List.of(created));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Open311ErrorDto> handleError(ResponseStatusException ex) {
        String code;
        if (ex.getStatusCode().value() == 403) {
            code = "clients/unknownClient";
        } else if (ex.getStatusCode().value() == 404) {
            code = "requests/unknownRequest";
        } else {
            code = "requests/error";
        }
        return ResponseEntity.status(ex.getStatusCode())
            .body(Open311ErrorDto.of(code, ex.getReason() != null ? ex.getReason() : ex.getMessage()));
    }

    private MediaType resolveMediaType(String ext, String formatParam) {
        String hint = ext != null ? ext : formatParam;
        if ("xml".equalsIgnoreCase(hint)) return MediaType.APPLICATION_XML;
        if ("json".equalsIgnoreCase(hint)) return MediaType.APPLICATION_JSON;
        return null;
    }
}
