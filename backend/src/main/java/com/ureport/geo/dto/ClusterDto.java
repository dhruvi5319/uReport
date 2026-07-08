package com.ureport.geo.dto;

public class ClusterDto {

    private Long id;
    private int level;
    private double lat;
    private double lon;
    private long ticketCount;

    public ClusterDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public int getLevel() { return level; }
    public void setLevel(int level) { this.level = level; }
    public double getLat() { return lat; }
    public void setLat(double lat) { this.lat = lat; }
    public double getLon() { return lon; }
    public void setLon(double lon) { this.lon = lon; }
    public long getTicketCount() { return ticketCount; }
    public void setTicketCount(long ticketCount) { this.ticketCount = ticketCount; }
}
