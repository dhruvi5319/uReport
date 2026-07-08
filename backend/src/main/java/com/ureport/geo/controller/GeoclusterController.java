package com.ureport.geo.controller;

import com.ureport.geo.dto.GeoclusterResponse;
import com.ureport.geo.service.GeoclusterService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/geoclusters")
public class GeoclusterController {

    private final GeoclusterService geoclusterService;

    public GeoclusterController(GeoclusterService geoclusterService) {
        this.geoclusterService = geoclusterService;
    }

    @GetMapping
    public GeoclusterResponse getClusters(
        @RequestParam int zoom,
        @RequestParam(required = false) String status) {
        return geoclusterService.getClustersByZoom(zoom, status);
    }
}
