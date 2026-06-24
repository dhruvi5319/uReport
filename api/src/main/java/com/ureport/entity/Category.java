package com.ureport.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "defaultPerson_id")
    private Person defaultPerson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoryGroup_id")
    private CategoryGroup categoryGroup;

    @Column(name = "active", nullable = false, columnDefinition = "BOOLEAN DEFAULT true")
    private Boolean active;

    @Column(name = "featured", nullable = false, columnDefinition = "BOOLEAN DEFAULT false")
    private Boolean featured;

    // CHECK(displayPermissionLevel IN ('staff','public','anonymous'))
    @Column(name = "displayPermissionLevel", nullable = false, length = 20,
            columnDefinition = "VARCHAR(20) DEFAULT 'anonymous'")
    private String displayPermissionLevel;

    // CHECK(postingPermissionLevel IN ('staff','public','anonymous'))
    @Column(name = "postingPermissionLevel", nullable = false, length = 20,
            columnDefinition = "VARCHAR(20) DEFAULT 'anonymous'")
    private String postingPermissionLevel;

    @Column(name = "customFields", columnDefinition = "jsonb")
    private String customFields;

    @Column(name = "lastModified", nullable = false, columnDefinition = "TIMESTAMPTZ DEFAULT NOW()")
    private OffsetDateTime lastModified;

    @Column(name = "slaDays")
    private Integer slaDays;

    @Column(name = "notificationReplyEmail", length = 255)
    private String notificationReplyEmail;

    @Column(name = "autoCloseIsActive", nullable = false, columnDefinition = "BOOLEAN DEFAULT false")
    private Boolean autoCloseIsActive;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "autoCloseSubstatus_id")
    private Substatus autoCloseSubstatus;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CategoryActionResponse> actionResponses = new ArrayList<>();

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        lastModified = OffsetDateTime.now();
    }

    // Getters and setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }

    /** Backward-compatible helper used by existing code */
    public Integer getDepartmentId() {
        return department != null ? department.getId() : null;
    }

    public Person getDefaultPerson() { return defaultPerson; }
    public void setDefaultPerson(Person defaultPerson) { this.defaultPerson = defaultPerson; }

    /** Backward-compatible helper used by existing code (TicketService) */
    public Integer getDefaultPersonId() {
        return defaultPerson != null ? defaultPerson.getId() : null;
    }

    public CategoryGroup getCategoryGroup() { return categoryGroup; }
    public void setCategoryGroup(CategoryGroup categoryGroup) { this.categoryGroup = categoryGroup; }

    /** Backward-compatible helper */
    public Integer getCategoryGroupId() {
        return categoryGroup != null ? categoryGroup.getId() : null;
    }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public Boolean getFeatured() { return featured; }
    public void setFeatured(Boolean featured) { this.featured = featured; }

    public String getDisplayPermissionLevel() { return displayPermissionLevel; }
    public void setDisplayPermissionLevel(String displayPermissionLevel) {
        this.displayPermissionLevel = displayPermissionLevel;
    }

    public String getPostingPermissionLevel() { return postingPermissionLevel; }
    public void setPostingPermissionLevel(String postingPermissionLevel) {
        this.postingPermissionLevel = postingPermissionLevel;
    }

    public String getCustomFields() { return customFields; }
    public void setCustomFields(String customFields) { this.customFields = customFields; }

    public OffsetDateTime getLastModified() { return lastModified; }
    public void setLastModified(OffsetDateTime lastModified) { this.lastModified = lastModified; }

    public Integer getSlaDays() { return slaDays; }
    public void setSlaDays(Integer slaDays) { this.slaDays = slaDays; }

    public String getNotificationReplyEmail() { return notificationReplyEmail; }
    public void setNotificationReplyEmail(String notificationReplyEmail) {
        this.notificationReplyEmail = notificationReplyEmail;
    }

    public Boolean getAutoCloseIsActive() { return autoCloseIsActive; }
    public void setAutoCloseIsActive(Boolean autoCloseIsActive) { this.autoCloseIsActive = autoCloseIsActive; }

    public Substatus getAutoCloseSubstatus() { return autoCloseSubstatus; }
    public void setAutoCloseSubstatus(Substatus autoCloseSubstatus) { this.autoCloseSubstatus = autoCloseSubstatus; }

    /** Backward-compatible helper */
    public Integer getAutoCloseSubstatusId() {
        return autoCloseSubstatus != null ? autoCloseSubstatus.getId() : null;
    }

    public List<CategoryActionResponse> getActionResponses() { return actionResponses; }
    public void setActionResponses(List<CategoryActionResponse> actionResponses) {
        this.actionResponses = actionResponses;
    }
}
