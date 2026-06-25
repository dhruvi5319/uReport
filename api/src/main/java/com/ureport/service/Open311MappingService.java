package com.ureport.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ureport.dto.response.Open311RequestResponse;
import com.ureport.dto.response.Open311ServiceAttributeResponse;
import com.ureport.dto.response.Open311ServiceResponse;
import com.ureport.entity.*;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Maps internal domain objects (Category, Ticket, etc.) to Open311 GeoReport v2 DTOs.
 * Field names must match GeoReport v2 spec exactly.
 */
@Service
public class Open311MappingService {

    private final ObjectMapper objectMapper;

    public Open311MappingService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Maps a Category (and its optional group) to an Open311ServiceResponse.
     */
    public Open311ServiceResponse toService(Category category, CategoryGroup group) {
        Open311ServiceResponse response = new Open311ServiceResponse();
        response.setServiceCode(String.valueOf(category.getId()));
        response.setServiceName(category.getName());
        response.setDescription(category.getDescription());
        response.setMetadata(
                category.getCustomFields() != null && !category.getCustomFields().isBlank()
                        ? "true" : "false"
        );
        response.setType("realtime");
        response.setKeywords(category.getName());
        response.setGroup(group != null ? group.getName() : null);

        // Map customFields JSONB to attributes list
        if (category.getCustomFields() != null && !category.getCustomFields().isBlank()) {
            try {
                Map<String, Object> fields = objectMapper.readValue(
                        category.getCustomFields(), new TypeReference<>() {});
                List<Open311ServiceAttributeResponse> attributes = new ArrayList<>();
                for (Map.Entry<String, Object> entry : fields.entrySet()) {
                    Open311ServiceAttributeResponse attr = new Open311ServiceAttributeResponse();
                    attr.setVariable(true);
                    attr.setCode(entry.getKey());

                    if (entry.getValue() instanceof Map<?, ?> fieldDef) {
                        attr.setDatatype(getString(fieldDef, "type", "string"));
                        attr.setRequired(getBoolean(fieldDef, "required", false));
                        attr.setDescription(getString(fieldDef, "label", entry.getKey()));
                        attr.setOrder(getInt(fieldDef, "order", 0));

                        // Map options for list types
                        Object optionsObj = fieldDef.get("options");
                        if (optionsObj instanceof List<?> optList) {
                            List<Map<String, String>> values = new ArrayList<>();
                            for (Object opt : optList) {
                                String optStr = String.valueOf(opt);
                                Map<String, String> valMap = new LinkedHashMap<>();
                                valMap.put("key", optStr);
                                valMap.put("name", optStr);
                                values.add(valMap);
                            }
                            attr.setValues(values.isEmpty() ? null : values);
                        }
                    } else {
                        attr.setDatatype("string");
                        attr.setRequired(false);
                        attr.setDescription(entry.getKey());
                        attr.setOrder(0);
                    }
                    attributes.add(attr);
                }
                response.setAttributes(attributes.isEmpty() ? null : attributes);
            } catch (Exception e) {
                // If JSON parsing fails, treat as no attributes
                response.setAttributes(null);
            }
        }

        return response;
    }

    /**
     * Maps a Ticket (with related entities) to an Open311RequestResponse.
     */
    public Open311RequestResponse toServiceRequest(Ticket ticket, Category category,
                                                    Substatus substatus, Person assignedPerson,
                                                    Media firstMedia) {
        Open311RequestResponse response = new Open311RequestResponse();
        response.setServiceRequestId(String.valueOf(ticket.getId()));
        response.setStatus(ticket.getStatus());
        response.setStatusNotes(substatus != null ? substatus.getName() : null);
        response.setServiceName(category.getName());
        response.setServiceCode(String.valueOf(category.getId()));
        response.setDescription(ticket.getDescription());

        if (assignedPerson != null) {
            response.setAgencyResponsible(
                    assignedPerson.getFirstname() + " " + assignedPerson.getLastname()
            );
        }

        // ISO 8601 datetimes
        if (ticket.getEnteredDate() != null) {
            response.setRequestedDatetime(
                    ticket.getEnteredDate().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        }
        if (ticket.getLastModified() != null) {
            response.setUpdatedDatetime(
                    ticket.getLastModified().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        }
        if (category.getSlaDays() != null && ticket.getEnteredDate() != null) {
            response.setExpectedDatetime(
                    ticket.getEnteredDate()
                            .plusDays(category.getSlaDays())
                            .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        }

        response.setLat(ticket.getLatitude() != null ? ticket.getLatitude().toPlainString() : null);
        response.setLng(ticket.getLongitude() != null ? ticket.getLongitude().toPlainString() : null);
        response.setAddress(ticket.getLocation());
        response.setAddressId(ticket.getAddressId() != null ? String.valueOf(ticket.getAddressId()) : null);
        response.setZipcode(ticket.getZip());
        response.setMediaUrl(firstMedia != null ? "/api/v1/media/" + firstMedia.getInternalFilename() : null);

        return response;
    }

    // Helper methods for safe map access
    private String getString(Map<?, ?> map, String key, String defaultVal) {
        Object val = map.get(key);
        return val != null ? String.valueOf(val) : defaultVal;
    }

    private boolean getBoolean(Map<?, ?> map, String key, boolean defaultVal) {
        Object val = map.get(key);
        if (val instanceof Boolean b) return b;
        if (val instanceof String s) return Boolean.parseBoolean(s);
        return defaultVal;
    }

    private int getInt(Map<?, ?> map, String key, int defaultVal) {
        Object val = map.get(key);
        if (val instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(String.valueOf(val));
        } catch (Exception e) {
            return defaultVal;
        }
    }
}
