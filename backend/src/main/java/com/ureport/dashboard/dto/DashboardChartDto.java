package com.ureport.dashboard.dto;

import java.util.List;

public class DashboardChartDto {

    private String groupBy;  // "status" | "category" | "department"
    private List<ChartSegmentDto> segments;

    public DashboardChartDto() {}

    public DashboardChartDto(String groupBy, List<ChartSegmentDto> segments) {
        this.groupBy = groupBy;
        this.segments = segments;
    }

    public String getGroupBy() { return groupBy; }
    public void setGroupBy(String groupBy) { this.groupBy = groupBy; }
    public List<ChartSegmentDto> getSegments() { return segments; }
    public void setSegments(List<ChartSegmentDto> segments) { this.segments = segments; }
}
