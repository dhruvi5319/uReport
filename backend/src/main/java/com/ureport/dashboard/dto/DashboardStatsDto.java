package com.ureport.dashboard.dto;

public class DashboardStatsDto {

    private long totalOpen;
    private long openedToday;
    private long closedToday;
    private long overdue;

    public DashboardStatsDto() {}

    public DashboardStatsDto(long totalOpen, long openedToday, long closedToday, long overdue) {
        this.totalOpen = totalOpen;
        this.openedToday = openedToday;
        this.closedToday = closedToday;
        this.overdue = overdue;
    }

    public long getTotalOpen() { return totalOpen; }
    public void setTotalOpen(long totalOpen) { this.totalOpen = totalOpen; }
    public long getOpenedToday() { return openedToday; }
    public void setOpenedToday(long openedToday) { this.openedToday = openedToday; }
    public long getClosedToday() { return closedToday; }
    public void setClosedToday(long closedToday) { this.closedToday = closedToday; }
    public long getOverdue() { return overdue; }
    public void setOverdue(long overdue) { this.overdue = overdue; }
}
