package com.ureport.controller;

import com.ureport.entity.Location;
import com.ureport.repository.LocationRepository;
import com.ureport.exception.NotFoundException;
import com.ureport.service.GeoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/locations")
@PreAuthorize("hasRole('STAFF')")
public class LocationController {

    private final LocationRepository locationRepository;
    private final GeoService geoService;

    @Autowired
    public LocationController(LocationRepository locationRepository, GeoService geoService) {
        this.locationRepository = locationRepository;
        this.geoService = geoService;
    }

    /**
     * GET /api/v1/locations — list locations (with optional address search)
     */
    @GetMapping
    public ResponseEntity<List<Location>> listLocations(
            @RequestParam(required = false) String q) {
        if (q != null && !q.isBlank()) {
            return ResponseEntity.ok(locationRepository.searchByAddress(q));
        }
        return ResponseEntity.ok(locationRepository.findAll());
    }

    /**
     * GET /api/v1/locations/{id} — location detail
     */
    @GetMapping("/{id}")
    public ResponseEntity<Location> getLocation(@PathVariable Integer id) {
        Location loc = locationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("LOCATION_NOT_FOUND",
                        "Location not found: " + id));
        return ResponseEntity.ok(loc);
    }

    /**
     * POST /api/v1/locations — create canonical location record
     */
    @PostMapping
    public ResponseEntity<Location> createLocation(@RequestBody Map<String, Object> body) {
        String address = (String) body.get("address");
        String city = (String) body.getOrDefault("city", "");
        String state = (String) body.getOrDefault("state", "");
        String zip = (String) body.getOrDefault("zip", "");

        Location loc = geoService.normalizeAddress(address, city, state, zip);

        // Set lat/long if provided
        if (body.get("latitude") != null) {
            loc.setLatitude(new BigDecimal(body.get("latitude").toString()));
        }
        if (body.get("longitude") != null) {
            loc.setLongitude(new BigDecimal(body.get("longitude").toString()));
        }
        if (loc.getLatitude() != null && loc.getLongitude() != null) {
            geoService.syncGeoPoint(loc);
        }

        return ResponseEntity.ok(loc);
    }
}
