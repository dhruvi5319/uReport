package com.ureport.crm.dto;

/**
 * Full ticket detail DTO with SLA fields.
 *
 * Shape per TechArch §4.3 and plan CASE-01 specification.
 */
public class TicketDetailDto {

    private Long id;
    private String status;
    private RefDto substatus;
    private RefDto category;
    private RefDto department;
    private RefDto assignedPerson;
    private RefDto reportedByPerson;
    private RefDto enteredByPerson;
    private String location;
    private String enteredDate;       // ISO 8601
    private String lastModified;      // ISO 8601
    private String description;
    private Double latitude;
    private Double longitude;
    private String city;
    private String state;
    private String zip;
    private Long parentId;
    private RefDto contactMethod;
    private RefDto issueType;
    private String closedDate;        // ISO 8601 or null
    private java.util.Map<String, Object> customFields;
    private RefDto client;
    private String slaDueDate;        // ISO 8601 or null — entered_date + sla_days
    private Boolean isOverdue;        // true if NOW > slaDueDate and status=open
    private Integer mediaCount;

    /**
     * Simple {id, name} reference DTO used for nested objects.
     */
    public static class RefDto {
        private Long id;
        private String name;

        public RefDto() {}
        public RefDto(Long id, String name) {
            this.id = id;
            this.name = name;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public RefDto getSubstatus() { return substatus; }
    public void setSubstatus(RefDto substatus) { this.substatus = substatus; }
    public RefDto getCategory() { return category; }
    public void setCategory(RefDto category) { this.category = category; }
    public RefDto getDepartment() { return department; }
    public void setDepartment(RefDto department) { this.department = department; }
    public RefDto getAssignedPerson() { return assignedPerson; }
    public void setAssignedPerson(RefDto assignedPerson) { this.assignedPerson = assignedPerson; }
    public RefDto getReportedByPerson() { return reportedByPerson; }
    public void setReportedByPerson(RefDto reportedByPerson) { this.reportedByPerson = reportedByPerson; }
    public RefDto getEnteredByPerson() { return enteredByPerson; }
    public void setEnteredByPerson(RefDto enteredByPerson) { this.enteredByPerson = enteredByPerson; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getEnteredDate() { return enteredDate; }
    public void setEnteredDate(String enteredDate) { this.enteredDate = enteredDate; }
    public String getLastModified() { return lastModified; }
    public void setLastModified(String lastModified) { this.lastModified = lastModified; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
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
    public Long getParentId() { return parentId; }
    public void setParentId(Long parentId) { this.parentId = parentId; }
    public RefDto getContactMethod() { return contactMethod; }
    public void setContactMethod(RefDto contactMethod) { this.contactMethod = contactMethod; }
    public RefDto getIssueType() { return issueType; }
    public void setIssueType(RefDto issueType) { this.issueType = issueType; }
    public String getClosedDate() { return closedDate; }
    public void setClosedDate(String closedDate) { this.closedDate = closedDate; }
    public java.util.Map<String, Object> getCustomFields() { return customFields; }
    public void setCustomFields(java.util.Map<String, Object> customFields) { this.customFields = customFields; }
    public RefDto getClient() { return client; }
    public void setClient(RefDto client) { this.client = client; }
    public String getSlaDueDate() { return slaDueDate; }
    public void setSlaDueDate(String slaDueDate) { this.slaDueDate = slaDueDate; }
    public Boolean getIsOverdue() { return isOverdue; }
    public void setIsOverdue(Boolean isOverdue) { this.isOverdue = isOverdue; }
    public Integer getMediaCount() { return mediaCount; }
    public void setMediaCount(Integer mediaCount) { this.mediaCount = mediaCount; }
}
