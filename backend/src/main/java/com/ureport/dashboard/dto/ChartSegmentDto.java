package com.ureport.dashboard.dto;

public class ChartSegmentDto {

    private String label;
    private long count;

    public ChartSegmentDto() {}

    public ChartSegmentDto(String label, long count) {
        this.label = label;
        this.count = count;
    }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public long getCount() { return count; }
    public void setCount(long count) { this.count = count; }
}
