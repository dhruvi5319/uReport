package com.ureport.geo.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * GET /api/geocode — forward and reverse geocoding proxy.
 *
 * Security: permitAll() in SecurityConfig line 65 — no auth required.
 *
 * Trust boundary: unauthenticated query string from any browser.
 * T-08-P2-01: q parameter is URL-encoded via URLEncoder before being forwarded to Nominatim
 *   — no string interpolation of raw user input into the URL path/query.
 *
 * Uses Nominatim (https://nominatim.openstreetmap.org) — free, no API key.
 * Nominatim TOS: requires User-Agent identifying the application.
 *
 * Network resilience: Nominatim may be unreachable in the K8s sandbox (egress restrictions).
 * All outbound call failures are caught and return empty suggestions / coordinate fallback
 * so the wizard degrades gracefully without crashing (non-fatal).
 */
@RestController
@RequestMapping("/api/geocode")
public class GeocodeController {

    private static final Logger log = LoggerFactory.getLogger(GeocodeController.class);

    private static final String NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
    private static final String USER_AGENT = "uReport-CRM/1.0 (city.gov)";

    private final RestTemplate restTemplate;

    public GeocodeController() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Forward geocode: GET /api/geocode?q={query}
     * Returns up to 5 address suggestions from Nominatim search.
     * Response: { suggestions: [{ display: string, lat: number, lon: number }] }
     *
     * Reverse geocode: GET /api/geocode?lat={lat}&lon={lon}
     * Returns address string for a coordinate (pin drag use case).
     * Response: { address: string }
     */
    @GetMapping
    public ResponseEntity<?> geocode(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lon) {

        // Reverse geocode: lat+lon → address string
        if (lat != null && lon != null) {
            return handleReverseGeocode(lat, lon);
        }

        // Forward geocode: q → suggestions list
        // Short queries (< 3 chars) produce noise — return empty immediately
        if (q == null || q.isBlank() || q.length() < 3) {
            return ResponseEntity.ok(Map.of("suggestions", List.of()));
        }

        return handleForwardGeocode(q.strip());
    }

    @SuppressWarnings("unchecked")
    private ResponseEntity<?> handleForwardGeocode(String query) {
        try {
            // T-08-P2-01: query is URL-encoded — never string-interpolated into URL
            String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);
            String url = NOMINATIM_BASE + "/search?q=" + encoded
                    + "&format=json&limit=5&addressdetails=0";

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", USER_AGENT);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<List> nominatimResponse =
                    restTemplate.exchange(URI.create(url), HttpMethod.GET, entity, List.class);

            List<Map<String, Object>> results = nominatimResponse.getBody();
            List<Map<String, Object>> suggestions = new ArrayList<>();
            if (results != null) {
                for (Map<String, Object> item : results) {
                    String display = (String) item.get("display_name");
                    Double itemLat = parseDouble(item.get("lat"));
                    Double itemLon = parseDouble(item.get("lon"));
                    if (display != null && itemLat != null && itemLon != null) {
                        suggestions.add(Map.of("display", display, "lat", itemLat, "lon", itemLon));
                    }
                }
            }
            return ResponseEntity.ok(Map.of("suggestions", suggestions));

        } catch (Exception e) {
            // Nominatim unavailable (e.g. sandbox network egress restriction, timeout, etc.)
            // → return empty suggestions so the wizard degrades gracefully without crashing
            log.warn("Nominatim forward geocode unavailable for query '{}': {}", query, e.getMessage());
            return ResponseEntity.ok(Map.of("suggestions", List.of()));
        }
    }

    @SuppressWarnings("unchecked")
    private ResponseEntity<?> handleReverseGeocode(double lat, double lon) {
        try {
            String url = NOMINATIM_BASE + "/reverse?lat=" + lat + "&lon=" + lon
                    + "&format=json&zoom=18&addressdetails=0";

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", USER_AGENT);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> nominatimResponse =
                    restTemplate.exchange(URI.create(url), HttpMethod.GET, entity, Map.class);

            Map<String, Object> result = nominatimResponse.getBody();
            String displayName = result != null ? (String) result.get("display_name") : null;
            if (displayName != null) {
                return ResponseEntity.ok(Map.of("address", displayName));
            }
            return ResponseEntity.ok(Map.of("address", lat + ", " + lon));

        } catch (Exception e) {
            // Non-fatal — return coordinate string as fallback address
            log.warn("Nominatim reverse geocode unavailable for {},{}: {}", lat, lon, e.getMessage());
            return ResponseEntity.ok(Map.of("address", lat + ", " + lon));
        }
    }

    private Double parseDouble(Object val) {
        if (val == null) return null;
        try {
            return Double.parseDouble(val.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
