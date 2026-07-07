package com.ureport.crm.dto;

/**
 * Request body for POST /api/tickets — create a new ticket.
 */
public class CreateTicketRequest {

    private Long categoryId;         // required
    private String description;      // required, min 1 char
    private String location;         // required if lat/lon not provided
    private Double latitude;
    private Double longitude;
    private String city;
    private String state;
    private String zip;
    private Long reportedByPersonId;
    private Long assignedPersonId;
    private Long issueTypeId;
    private Long contactMethodId;
    private java.util.Map<String, Object> customFields;

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getZip() { return zip; }
    public void setZip(String zip) { this.zip = zip; }
    public Long getReportedByPersonId() { return reportedByPersonId; }
    public void setReportedByPersonId(Long reportedByPersonId) { this.reportedByPersonId = reportedByPersonId; }
    public Long getAssignedPersonId() { return assignedPersonId; }
    public void setAssignedPersonId(Long assignedPersonId) { this.assignedPersonId = assignedPersonId; }
    public Long getIssueTypeId() { return issueTypeId; }
    public void setIssueTypeId(Long issueTypeId) { this.issueTypeId = issueTypeId; }
    public Long getContactMethodId() { return contactMethodId; }
    public void setContactMethodId(Long contactMethodId) { this.contactMethodId = contactMethodId; }
    public java.util.Map<String, Object> getCustomFields() { return customFields; }
    public void setCustomFields(java.util.Map<String, Object> customFields) { this.customFields = customFields; }
}
