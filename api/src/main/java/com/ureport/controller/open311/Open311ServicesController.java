package com.ureport.controller.open311;

import com.ureport.dto.response.Open311ServiceResponse;
import com.ureport.entity.Category;
import com.ureport.entity.CategoryGroup;
import com.ureport.repository.CategoryGroupRepository;
import com.ureport.repository.CategoryRepository;
import com.ureport.service.Open311MappingService;
import com.ureport.service.Open311XmlSerializer;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Open311 GeoReport v2 Services endpoints.
 * GET /open311/services        — list all public services
 * GET /open311/services/{code} — single service detail with attributes
 *
 * No authentication required.
 */
@RestController
public class Open311ServicesController {

    private final CategoryRepository categoryRepository;
    private final CategoryGroupRepository categoryGroupRepository;
    private final Open311MappingService mappingService;
    private final Open311XmlSerializer xmlSerializer;

    public Open311ServicesController(CategoryRepository categoryRepository,
                                     CategoryGroupRepository categoryGroupRepository,
                                     Open311MappingService mappingService,
                                     Open311XmlSerializer xmlSerializer) {
        this.categoryRepository = categoryRepository;
        this.categoryGroupRepository = categoryGroupRepository;
        this.mappingService = mappingService;
        this.xmlSerializer = xmlSerializer;
    }

    /**
     * GET /open311/services
     * Returns all active, publicly-postable categories mapped to Open311 service objects.
     * Supports ?service_code= to filter, ?format=xml for XML output.
     */
    @GetMapping("/open311/services")
    public ResponseEntity<?> listServices(
            @RequestParam(value = "service_code", required = false) String serviceCode,
            @RequestParam(value = "format", required = false) String format) {

        List<Category> categories = categoryRepository.findByActiveTrue();

        // Filter to public/anonymous posting permission
        categories = categories.stream()
                .filter(c -> "public".equals(c.getPostingPermissionLevel())
                        || "anonymous".equals(c.getPostingPermissionLevel()))
                .toList();

        // Optional filter by service_code
        if (serviceCode != null && !serviceCode.isBlank()) {
            try {
                int id = Integer.parseInt(serviceCode);
                categories = categories.stream()
                        .filter(c -> id == c.getId())
                        .toList();
            } catch (NumberFormatException e) {
                categories = List.of();
            }
        }

        // Sort by category group ordering ASC NULLS LAST, then name ASC
        categories = categories.stream()
                .sorted(Comparator.comparingInt((Category c) -> {
                    if (c.getCategoryGroupId() == null) return Integer.MAX_VALUE;
                    return categoryGroupRepository.findById(c.getCategoryGroupId())
                            .map(g -> g.getOrdering() != null ? g.getOrdering() : Integer.MAX_VALUE)
                            .orElse(Integer.MAX_VALUE);
                }).thenComparing(Category::getName))
                .toList();

        // Build group cache
        Map<Integer, CategoryGroup> groupCache = new HashMap<>();
        for (Category cat : categories) {
            if (cat.getCategoryGroupId() != null && !groupCache.containsKey(cat.getCategoryGroupId())) {
                categoryGroupRepository.findById(cat.getCategoryGroupId())
                        .ifPresent(g -> groupCache.put(g.getId(), g));
            }
        }

        List<Open311ServiceResponse> services = categories.stream()
                .map(c -> mappingService.toService(c, groupCache.get(c.getCategoryGroupId())))
                .toList();

        if ("xml".equals(format)) {
            String xml = xmlSerializer.serializeServices(services);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_XML)
                    .body(xml);
        }

        return ResponseEntity.ok(services);
    }

    /**
     * GET /open311/services/{service_code}
     * Returns single service detail with attributes populated.
     */
    @GetMapping("/open311/services/{service_code}")
    public ResponseEntity<?> getService(
            @PathVariable("service_code") String serviceCode,
            @RequestParam(value = "format", required = false) String format) {

        int id;
        try {
            id = Integer.parseInt(serviceCode);
        } catch (NumberFormatException e) {
            return ResponseEntity.status(404)
                    .body(Map.of("error", "SERVICE_NOT_FOUND"));
        }

        Optional<Category> categoryOpt = categoryRepository.findById(id);
        if (categoryOpt.isEmpty()) {
            return ResponseEntity.status(404)
                    .body(Map.of("error", "SERVICE_NOT_FOUND"));
        }

        Category category = categoryOpt.get();
        CategoryGroup group = null;
        if (category.getCategoryGroupId() != null) {
            group = categoryGroupRepository.findById(category.getCategoryGroupId()).orElse(null);
        }

        Open311ServiceResponse service = mappingService.toService(category, group);
        List<Open311ServiceResponse> services = List.of(service);

        if ("xml".equals(format)) {
            String xml = xmlSerializer.serializeServices(services);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_XML)
                    .body(xml);
        }

        return ResponseEntity.ok(services);
    }
}
