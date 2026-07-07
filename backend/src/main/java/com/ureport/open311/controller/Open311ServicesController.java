package com.ureport.open311.controller;

import com.ureport.open311.dto.Open311ErrorDto;
import com.ureport.open311.dto.Open311ServiceDto;
import com.ureport.open311.service.Open311ServiceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/open311/v2")
public class Open311ServicesController {

    private final Open311ServiceService serviceService;

    public Open311ServicesController(Open311ServiceService serviceService) {
        this.serviceService = serviceService;
    }

    /**
     * GET /open311/v2/services
     * GET /open311/v2/services.json
     * GET /open311/v2/services.xml
     *
     * Content negotiation priority (TechArch §4.1):
     * 1. URL suffix (.json/.xml) — handled via path variable {ext}
     * 2. format query param
     * 3. Accept header (Spring default)
     * 4. Default: JSON
     */
    @GetMapping(
        value = {"/services", "/services.{ext}"},
        produces = {MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE}
    )
    public ResponseEntity<?> getServices(
        @RequestParam(name = "api_key", required = false) String apiKey,
        @RequestParam(name = "format", required = false) String formatParam,
        @PathVariable(name = "ext", required = false) String ext
    ) {
        List<Open311ServiceDto> services = serviceService.getServiceList(apiKey);
        MediaType responseType = resolveMediaType(ext, formatParam);
        if (responseType != null) {
            return ResponseEntity.ok().contentType(responseType).body(services);
        }
        return ResponseEntity.ok(services);
    }

    /**
     * GET /open311/v2/services/{service_code}
     * GET /open311/v2/services/{service_code}.json
     * GET /open311/v2/services/{service_code}.xml
     */
    @GetMapping(
        value = {"/services/{serviceCode}", "/services/{serviceCode}.{ext}"},
        produces = {MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE}
    )
    public ResponseEntity<?> getService(
        @PathVariable String serviceCode,
        @RequestParam(name = "format", required = false) String formatParam,
        @PathVariable(name = "ext", required = false) String ext
    ) {
        Open311ServiceDto service = serviceService.getServiceInfo(serviceCode);
        MediaType responseType = resolveMediaType(ext, formatParam);
        if (responseType != null) {
            return ResponseEntity.ok().contentType(responseType).body(service);
        }
        return ResponseEntity.ok(service);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Open311ErrorDto> handleNotFound(ResponseStatusException ex) {
        String code = ex.getStatusCode() == HttpStatus.NOT_FOUND
            ? "services/unknownService"
            : "services/accessDenied";
        return ResponseEntity.status(ex.getStatusCode())
            .body(Open311ErrorDto.of(code, ex.getReason()));
    }

    /**
     * Resolves explicit media type from URL extension or format param.
     * Returns null if neither is present (let Spring negotiate from Accept header).
     */
    private MediaType resolveMediaType(String ext, String formatParam) {
        String hint = ext != null ? ext : formatParam;
        if ("xml".equalsIgnoreCase(hint)) return MediaType.APPLICATION_XML;
        if ("json".equalsIgnoreCase(hint)) return MediaType.APPLICATION_JSON;
        return null;
    }
}
