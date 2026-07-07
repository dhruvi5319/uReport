package com.ureport.open311.service;

import com.ureport.open311.dto.Open311ServiceDto;
import com.ureport.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class Open311ServiceService {

    private final CategoryRepository categoryRepository;

    @Value("${open311.obsolete-api-keys:}")
    private String obsoleteApiKeysRaw;

    public Open311ServiceService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    /**
     * Returns the full service list, or 3 synthetic shutdown entries if apiKey is obsolete.
     *
     * @param apiKey optional api_key query param (may be null)
     */
    public List<Open311ServiceDto> getServiceList(String apiKey) {
        if (apiKey != null && isObsoleteKey(apiKey)) {
            return buildObsoleteResponse();
        }
        return categoryRepository.findByActiveTrue().stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    /**
     * Returns a single service object by service_code (category id).
     * Throws 404 if not found or not active.
     */
    public Open311ServiceDto getServiceInfo(String serviceCode) {
        Long id;
        try {
            id = Long.parseLong(serviceCode);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Service not found");
        }
        return categoryRepository.findById(id)
            .filter(c -> Boolean.TRUE.equals(c.getActive()))
            .map(this::toDto)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Service not found"));
    }

    private boolean isObsoleteKey(String apiKey) {
        if (obsoleteApiKeysRaw == null || obsoleteApiKeysRaw.isBlank()) return false;
        return Arrays.stream(obsoleteApiKeysRaw.split(","))
            .map(String::trim)
            .anyMatch(k -> k.equals(apiKey));
    }

    /** Maps Category entity to Open311ServiceDto with all required GeoReport v2 fields */
    private Open311ServiceDto toDto(com.ureport.domain.Category category) {
        var dto = new Open311ServiceDto();
        dto.setServiceCode(category.getId().toString());
        dto.setServiceName(category.getName());
        dto.setDescription(category.getDescription() != null ? category.getDescription() : "");
        dto.setMetadata(false);
        dto.setType("realtime");
        dto.setKeywords("");
        dto.setGroup(category.getCategoryGroup() != null ? category.getCategoryGroup().getName() : "");
        return dto;
    }

    /**
     * OBSOLETE_API_KEYS behavior: return exactly 3 synthetic "mobile shutdown" service objects.
     * From TechArch / PHP reference:
     *   group1: "This app has been updated", service_name: "to work in mobile web browsers"
     *   group2: "To report issues to the City", service_name: "direct your mobile browser to:"
     *   group3: "bloomington.in.gov/ureport", service_name: "Thank you!"
     * All have service_code="XXX", description="Go to blooomington.in.gov/ureport",
     *   metadata=false, type="realtime", keywords=""
     */
    private List<Open311ServiceDto> buildObsoleteResponse() {
        return List.of(
            buildSynthetic("to work in mobile web browsers", "This app has been updated"),
            buildSynthetic("direct your mobile browser to:", "To report issues to the City"),
            buildSynthetic("Thank you!", "bloomington.in.gov/ureport")
        );
    }

    private Open311ServiceDto buildSynthetic(String serviceName, String group) {
        var dto = new Open311ServiceDto();
        dto.setServiceCode("XXX");
        dto.setServiceName(serviceName);
        dto.setDescription("Go to blooomington.in.gov/ureport");
        dto.setMetadata(false);
        dto.setType("realtime");
        dto.setKeywords("");
        dto.setGroup(group);
        return dto;
    }
}
