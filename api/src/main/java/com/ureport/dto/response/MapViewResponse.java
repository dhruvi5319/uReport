package com.ureport.dto.response;

import java.util.List;

/**
 * Response DTO for the GET /api/v1/tickets/map geo-cluster endpoint.
 * Each cluster aggregates tickets in a geographic grid cell at the requested zoom level.
 */
public class MapViewResponse {

    private List<MapCluster> clusters;

    public List<MapCluster> getClusters() { return clusters; }
    public void setClusters(List<MapCluster> clusters) { this.clusters = clusters; }

    public static class MapCluster {
        private Long clusterId;
        private Long count;
        private Double lat;
        private Double lon;

        public Long getClusterId() { return clusterId; }
        public void setClusterId(Long clusterId) { this.clusterId = clusterId; }

        public Long getCount() { return count; }
        public void setCount(Long count) { this.count = count; }

        public Double getLat() { return lat; }
        public void setLat(Double lat) { this.lat = lat; }

        public Double getLon() { return lon; }
        public void setLon(Double lon) { this.lon = lon; }
    }
}
