package com.ureport.dto.response;

import java.math.BigDecimal;

/**
 * Lightweight DTO for ticket list/search results.
 * Used by TicketSearchService for paginated search, map view clustering, and CSV export.
 */
public class TicketSummaryResponse {

    private Long id;
    private String status;
    private String substatusName;
    private Integer categoryId;
    private String categoryName;
    private String description;
    private String location;
    private String city;
    private String state;
    private String zip;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String enteredDate;         // ISO 8601
    private String lastModified;        // ISO 8601
    private String closedDate;          // ISO 8601, nullable
    private Integer assignedPersonId;
    private String assignedPersonName;
    private String contactMethodName;
    private Integer mediaCount;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getSubstatusName() { return substatusName; }
    public void setSubstatusName(String substatusName) { this.substatusName = substatusName; }

    public Integer getCategoryId() { return categoryId; }
    public void setCategoryId(Integer categoryId) { this.categoryId = categoryId; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getZip() { return zip; }
    public void setZip(String zip) { this.zip = zip; }

    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }

    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }

    public String getEnteredDate() { return enteredDate; }
    public void setEnteredDate(String enteredDate) { this.enteredDate = enteredDate; }

    public String getLastModified() { return lastModified; }
    public void setLastModified(String lastModified) { this.lastModified = lastModified; }

    public String getClosedDate() { return closedDate; }
    public void setClosedDate(String closedDate) { this.closedDate = closedDate; }

    public Integer getAssignedPersonId() { return assignedPersonId; }
    public void setAssignedPersonId(Integer assignedPersonId) { this.assignedPersonId = assignedPersonId; }

    public String getAssignedPersonName() { return assignedPersonName; }
    public void setAssignedPersonName(String assignedPersonName) { this.assignedPersonName = assignedPersonName; }

    public String getContactMethodName() { return contactMethodName; }
    public void setContactMethodName(String contactMethodName) { this.contactMethodName = contactMethodName; }

    public Integer getMediaCount() { return mediaCount; }
    public void setMediaCount(Integer mediaCount) { this.mediaCount = mediaCount; }
}
