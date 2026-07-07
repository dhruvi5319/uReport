package com.ureport.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "parent_id")
    private Long parentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issue_type_id")
    private IssueType issueType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entered_by_person_id")
    private Person enteredByPerson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_by_person_id")
    private Person reportedByPerson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_person_id")
    private Person assignedPerson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_method_id")
    private ContactMethod contactMethod;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "substatus_id")
    private Substatus substatus;

    @Column(name = "entered_date")
    private LocalDateTime enteredDate;

    @Column(name = "last_modified")
    private LocalDateTime lastModified;

    @Column(name = "closed_date")
    private LocalDateTime closedDate;

    @Column(name = "address_id")
    private String addressId;

    private Double latitude;
    private Double longitude;
    private String location;
    private String city;
    private String state;
    private String zip;
    private String status;

    @Column(name = "additional_fields")
    private String additionalFields;

    @Column(name = "custom_fields")
    private String customFields;

    private String description;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getParentId() { return parentId; }
    public void setParentId(Long parentId) { this.parentId = parentId; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    public IssueType getIssueType() { return issueType; }
    public void setIssueType(IssueType issueType) { this.issueType = issueType; }
    public Client getClient() { return client; }
    public void setClient(Client client) { this.client = client; }
    public Person getEnteredByPerson() { return enteredByPerson; }
    public void setEnteredByPerson(Person enteredByPerson) { this.enteredByPerson = enteredByPerson; }
    public Person getReportedByPerson() { return reportedByPerson; }
    public void setReportedByPerson(Person reportedByPerson) { this.reportedByPerson = reportedByPerson; }
    public Person getAssignedPerson() { return assignedPerson; }
    public void setAssignedPerson(Person assignedPerson) { this.assignedPerson = assignedPerson; }
    public ContactMethod getContactMethod() { return contactMethod; }
    public void setContactMethod(ContactMethod contactMethod) { this.contactMethod = contactMethod; }
    public Substatus getSubstatus() { return substatus; }
    public void setSubstatus(Substatus substatus) { this.substatus = substatus; }
    public LocalDateTime getEnteredDate() { return enteredDate; }
    public void setEnteredDate(LocalDateTime enteredDate) { this.enteredDate = enteredDate; }
    public LocalDateTime getLastModified() { return lastModified; }
    public void setLastModified(LocalDateTime lastModified) { this.lastModified = lastModified; }
    public LocalDateTime getClosedDate() { return closedDate; }
    public void setClosedDate(LocalDateTime closedDate) { this.closedDate = closedDate; }
    public String getAddressId() { return addressId; }
    public void setAddressId(String addressId) { this.addressId = addressId; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
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
    public String getAdditionalFields() { return additionalFields; }
    public void setAdditionalFields(String additionalFields) { this.additionalFields = additionalFields; }
    public String getCustomFields() { return customFields; }
    public void setCustomFields(String customFields) { this.customFields = customFields; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
