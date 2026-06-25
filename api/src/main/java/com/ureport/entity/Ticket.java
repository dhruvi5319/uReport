package com.ureport.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "tickets")
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "parent_id")
    private Long parentId;

    @Column(name = "category_id", nullable = false)
    private Integer categoryId;

    @Column(name = "issueType_id")
    private Integer issueTypeId;

    @Column(name = "client_id")
    private Integer clientId;

    @Column(name = "enteredByPerson_id")
    private Integer enteredByPersonId;

    @Column(name = "reportedByPerson_id")
    private Integer reportedByPersonId;

    @Column(name = "assignedPerson_id")
    private Integer assignedPersonId;

    @Column(name = "contactMethod_id")
    private Integer contactMethodId;

    @Column(name = "responseMethod_id")
    private Integer responseMethodId;

    @Column(name = "enteredDate")
    private OffsetDateTime enteredDate;

    @Column(name = "lastModified")
    private OffsetDateTime lastModified;

    @Column(name = "addressId")
    private Integer addressId;

    @Column(name = "latitude", precision = 9, scale = 6)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 9, scale = 6)
    private BigDecimal longitude;

    @Column(name = "location")
    private String location;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 2)
    private String state;

    @Column(name = "zip", length = 10)
    private String zip;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "closedDate")
    private OffsetDateTime closedDate;

    @Column(name = "substatus_id")
    private Integer substatusId;

    @Column(name = "additionalFields", columnDefinition = "TEXT")
    private String additionalFields;

    @Column(name = "customFields", columnDefinition = "TEXT")
    private String customFields;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "search_vector", insertable = false, updatable = false)
    private String searchVector;

    @PrePersist
    protected void onCreate() {
        if (enteredDate == null) enteredDate = OffsetDateTime.now();
        if (lastModified == null) lastModified = OffsetDateTime.now();
        if (status == null) status = "open";
    }

    @PreUpdate
    protected void onUpdate() {
        lastModified = OffsetDateTime.now();
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getParentId() { return parentId; }
    public void setParentId(Long parentId) { this.parentId = parentId; }

    public Integer getCategoryId() { return categoryId; }
    public void setCategoryId(Integer categoryId) { this.categoryId = categoryId; }

    public Integer getIssueTypeId() { return issueTypeId; }
    public void setIssueTypeId(Integer issueTypeId) { this.issueTypeId = issueTypeId; }

    public Integer getClientId() { return clientId; }
    public void setClientId(Integer clientId) { this.clientId = clientId; }

    public Integer getEnteredByPersonId() { return enteredByPersonId; }
    public void setEnteredByPersonId(Integer enteredByPersonId) { this.enteredByPersonId = enteredByPersonId; }

    public Integer getReportedByPersonId() { return reportedByPersonId; }
    public void setReportedByPersonId(Integer reportedByPersonId) { this.reportedByPersonId = reportedByPersonId; }

    public Integer getAssignedPersonId() { return assignedPersonId; }
    public void setAssignedPersonId(Integer assignedPersonId) { this.assignedPersonId = assignedPersonId; }

    public Integer getContactMethodId() { return contactMethodId; }
    public void setContactMethodId(Integer contactMethodId) { this.contactMethodId = contactMethodId; }

    public Integer getResponseMethodId() { return responseMethodId; }
    public void setResponseMethodId(Integer responseMethodId) { this.responseMethodId = responseMethodId; }

    public OffsetDateTime getEnteredDate() { return enteredDate; }
    public void setEnteredDate(OffsetDateTime enteredDate) { this.enteredDate = enteredDate; }

    public OffsetDateTime getLastModified() { return lastModified; }
    public void setLastModified(OffsetDateTime lastModified) { this.lastModified = lastModified; }

    public Integer getAddressId() { return addressId; }
    public void setAddressId(Integer addressId) { this.addressId = addressId; }

    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }

    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getZip() { return zip; }
    public void setZip(String zip) { this.zip = zip; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public OffsetDateTime getClosedDate() { return closedDate; }
    public void setClosedDate(OffsetDateTime closedDate) { this.closedDate = closedDate; }

    public Integer getSubstatusId() { return substatusId; }
    public void setSubstatusId(Integer substatusId) { this.substatusId = substatusId; }

    public String getAdditionalFields() { return additionalFields; }
    public void setAdditionalFields(String additionalFields) { this.additionalFields = additionalFields; }

    public String getCustomFields() { return customFields; }
    public void setCustomFields(String customFields) { this.customFields = customFields; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSearchVector() { return searchVector; }
}
