package com.ureport.geo.service;

import com.ureport.geo.dto.ClusterDto;
import com.ureport.geo.dto.GeoclusterResponse;
import com.ureport.repository.GeoclusterRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Geo-clustering service — zoom whitelist via Java switch, no dynamic SQL column names.
 * T-06-06 mitigated: column name is NEVER interpolated into SQL; each zoom level
 * has its own pre-written @Query method in GeoclusterRepository.
 */
@Service
public class GeoclusterService {

    private static final Set<Integer> VALID_ZOOM_LEVELS = Set.of(0, 1, 2, 3, 4, 5, 6);

    private final GeoclusterRepository geoclusterRepository;

    public GeoclusterService(GeoclusterRepository geoclusterRepository) {
        this.geoclusterRepository = geoclusterRepository;
    }

    public GeoclusterResponse getClustersByZoom(int zoom, String status) {
        if (!VALID_ZOOM_LEVELS.contains(zoom)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "zoom must be between 0 and 6");
        }
        String statusParam = (status == null || status.isBlank()) ? null : status;

        List<Object[]> rows = switch (zoom) {
            case 0 -> geoclusterRepository.findClusters0(statusParam);
            case 1 -> geoclusterRepository.findClusters1(statusParam);
            case 2 -> geoclusterRepository.findClusters2(statusParam);
            case 3 -> geoclusterRepository.findClusters3(statusParam);
            case 4 -> geoclusterRepository.findClusters4(statusParam);
            case 5 -> geoclusterRepository.findClusters5(statusParam);
            case 6 -> geoclusterRepository.findClusters6(statusParam);
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid zoom");
        };

        List<ClusterDto> clusters = rows.stream().map(row -> {
            ClusterDto dto = new ClusterDto();
            dto.setId(((Number) row[0]).longValue());          // cluster_id
            dto.setTicketCount(((Number) row[1]).longValue()); // count
            dto.setLevel(((Number) row[2]).intValue());        // level
            // Parse lon and lat from center_text "(x,y)" — PostgreSQL POINT text form
            String centerText = (String) row[3];              // e.g. "(34.05,-118.24)"
            String stripped = centerText.replace("(", "").replace(")", "");
            String[] parts = stripped.split(",");
            dto.setLon(Double.parseDouble(parts[0].trim()));
            dto.setLat(Double.parseDouble(parts[1].trim()));
            return dto;
        }).collect(Collectors.toList());

        return new GeoclusterResponse(clusters);
    }
}
