package com.ureport.geo.dto;

import java.util.List;

public class GeoclusterResponse {

    private List<ClusterDto> clusters;

    public GeoclusterResponse() {}

    public GeoclusterResponse(List<ClusterDto> clusters) {
        this.clusters = clusters;
    }

    public List<ClusterDto> getClusters() { return clusters; }
    public void setClusters(List<ClusterDto> clusters) { this.clusters = clusters; }
}
