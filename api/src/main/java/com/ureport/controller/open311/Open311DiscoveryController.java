package com.ureport.controller.open311;

import com.ureport.service.Open311XmlSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.*;

/**
 * GET /open311/discovery — Open311 GeoReport v2 Discovery endpoint.
 * No authentication required (public).
 */
@RestController
public class Open311DiscoveryController {

    @Value("${app.open311.contact:support@ureport.local}")
    private String contact;

    @Value("${app.open311.keyService:}")
    private String keyService;

    @Value("${app.open311.baseUrl:http://localhost:8080}")
    private String baseUrl;

    private final Open311XmlSerializer xmlSerializer;

    public Open311DiscoveryController(Open311XmlSerializer xmlSerializer) {
        this.xmlSerializer = xmlSerializer;
    }

    @GetMapping("/open311/discovery")
    public ResponseEntity<?> discovery(
            @RequestParam(value = "format", required = false) String format) {

        String changeset = LocalDate.now().toString();

        List<Map<String, Object>> endpoints = new ArrayList<>();
        endpoints.add(buildEndpoint(
                "http://wiki.open311.org/GeoReport_v2",
                baseUrl + "/open311/services",
                changeset,
                "GET",
                List.of("text/json", "text/xml")
        ));
        endpoints.add(buildEndpoint(
                "http://wiki.open311.org/GeoReport_v2",
                baseUrl + "/open311/services/{service_code}",
                changeset,
                "GET",
                List.of("text/json", "text/xml")
        ));
        endpoints.add(buildEndpoint(
                "http://wiki.open311.org/GeoReport_v2",
                baseUrl + "/open311/requests",
                changeset,
                "POST",
                List.of("text/json", "text/xml")
        ));
        endpoints.add(buildEndpoint(
                "http://wiki.open311.org/GeoReport_v2",
                baseUrl + "/open311/requests",
                changeset,
                "GET",
                List.of("text/json", "text/xml")
        ));
        endpoints.add(buildEndpoint(
                "http://wiki.open311.org/GeoReport_v2",
                baseUrl + "/open311/requests/{service_request_id}",
                changeset,
                "GET",
                List.of("text/json", "text/xml")
        ));

        Map<String, Object> discoveryData = new LinkedHashMap<>();
        discoveryData.put("changeset", changeset);
        discoveryData.put("contact", contact);
        discoveryData.put("key_service", keyService);
        discoveryData.put("endpoints", endpoints);

        if ("xml".equals(format)) {
            String xml = xmlSerializer.serializeDiscovery(discoveryData);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_XML)
                    .body(xml);
        }

        return ResponseEntity.ok(discoveryData);
    }

    private Map<String, Object> buildEndpoint(String specification, String url,
                                               String changeset, String type,
                                               List<String> formats) {
        Map<String, Object> ep = new LinkedHashMap<>();
        ep.put("specification", specification);
        ep.put("url", url);
        ep.put("changeset", changeset);
        ep.put("type", type);
        ep.put("formats", formats);
        return ep;
    }
}
