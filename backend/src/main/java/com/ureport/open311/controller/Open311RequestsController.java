package com.ureport.open311.controller;

import com.ureport.open311.dto.Open311ErrorDto;
import com.ureport.open311.dto.Open311ServiceRequestDto;
import com.ureport.open311.service.Open311RequestService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/open311/v2")
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
