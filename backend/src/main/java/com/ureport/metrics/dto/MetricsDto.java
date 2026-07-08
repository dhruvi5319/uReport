package com.ureport.metrics.dto;

import java.util.List;

public class MetricsDto {

    private List<VolumeByDayDto> volumeByDay;
    private Double avgResolutionHours;  // null if no closed tickets in range
    private long overdueCount;

    public MetricsDto() {}

    public MetricsDto(List<VolumeByDayDto> volumeByDay, Double avgResolutionHours, long overdueCount) {
        this.volumeByDay = volumeByDay;
        this.avgResolutionHours = avgResolutionHours;
        this.overdueCount = overdueCount;
    }

    public List<VolumeByDayDto> getVolumeByDay() { return volumeByDay; }
    public void setVolumeByDay(List<VolumeByDayDto> volumeByDay) { this.volumeByDay = volumeByDay; }
    public Double getAvgResolutionHours() { return avgResolutionHours; }
    public void setAvgResolutionHours(Double avgResolutionHours) { this.avgResolutionHours = avgResolutionHours; }
    public long getOverdueCount() { return overdueCount; }
    public void setOverdueCount(long overdueCount) { this.overdueCount = overdueCount; }
}
