package com.ureport.open311.controller;

import com.ureport.open311.dto.Open311ErrorDto;
import com.ureport.open311.dto.Open311ServiceDto;
import com.ureport.open311.service.Open311ServiceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/open311/v2")
@Tag(name = "Open311 Services", description = "GeoReport v2 service discovery endpoints")
@SecurityRequirement(name = "bearerAuth")
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
    @Operation(summary = "List all services",
        description = "Returns all active service categories. If api_key matches an obsolete key, returns 3 mobile shutdown notice entries.")
    @Parameter(name = "api_key", description = "Open311 client API key (optional; obsolete keys trigger shutdown notice)", required = false)
    @Parameter(name = "format", description = "Response format: json (default) or xml", required = false)
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Array of Open311 service objects"),
    })
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
    @Operation(summary = "Get service by code",
        description = "Returns a single service category by service_code (category id)")
    @Parameter(name = "serviceCode", description = "The service_code (numeric category id)")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Single Open311 service object"),
        @ApiResponse(responseCode = "404", description = "Service not found"),
    })
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
