package com.ureport.metrics.dto;

public class ReportGroupDto {

    private String groupName;
    private Long groupId;
    private long openCount;
    private long closedCount;
    private Double avgResolutionHours;  // null if no closed tickets

    public ReportGroupDto() {}

    public String getGroupName() { return groupName; }
    public void setGroupName(String groupName) { this.groupName = groupName; }
    public Long getGroupId() { return groupId; }
    public void setGroupId(Long groupId) { this.groupId = groupId; }
    public long getOpenCount() { return openCount; }
    public void setOpenCount(long openCount) { this.openCount = openCount; }
    public long getClosedCount() { return closedCount; }
    public void setClosedCount(long closedCount) { this.closedCount = closedCount; }
    public Double getAvgResolutionHours() { return avgResolutionHours; }
    public void setAvgResolutionHours(Double avgResolutionHours) { this.avgResolutionHours = avgResolutionHours; }
}
