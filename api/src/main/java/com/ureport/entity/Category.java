package com.ureport.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

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

    @Column(name = "department_id")
    private Integer departmentId;

    @Column(name = "defaultPerson_id")
    private Integer defaultPersonId;

    @Column(name = "categoryGroup_id")
    private Integer categoryGroupId;

    @Column(name = "active", nullable = false)
    private Boolean active;

    @Column(name = "featured")
    private Boolean featured;

    @Column(name = "displayPermissionLevel", nullable = false, length = 20)
    private String displayPermissionLevel;

    @Column(name = "postingPermissionLevel", nullable = false, length = 20)
    private String postingPermissionLevel;

    @Column(name = "customFields", columnDefinition = "TEXT")
    private String customFields;

    @Column(name = "lastModified")
    private OffsetDateTime lastModified;

    @Column(name = "slaDays")
    private Integer slaDays;

    @Column(name = "notificationReplyEmail", length = 255)
    private String notificationReplyEmail;

    @Column(name = "autoCloseIsActive")
    private Boolean autoCloseIsActive;

    @Column(name = "autoCloseSubstatus_id")
    private Integer autoCloseSubstatusId;

    // Getters and setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getDepartmentId() { return departmentId; }
    public void setDepartmentId(Integer departmentId) { this.departmentId = departmentId; }

    public Integer getDefaultPersonId() { return defaultPersonId; }
    public void setDefaultPersonId(Integer defaultPersonId) { this.defaultPersonId = defaultPersonId; }

    public Integer getCategoryGroupId() { return categoryGroupId; }
    public void setCategoryGroupId(Integer categoryGroupId) { this.categoryGroupId = categoryGroupId; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public Boolean getFeatured() { return featured; }
    public void setFeatured(Boolean featured) { this.featured = featured; }

    public String getDisplayPermissionLevel() { return displayPermissionLevel; }
    public void setDisplayPermissionLevel(String displayPermissionLevel) { this.displayPermissionLevel = displayPermissionLevel; }

    public String getPostingPermissionLevel() { return postingPermissionLevel; }
    public void setPostingPermissionLevel(String postingPermissionLevel) { this.postingPermissionLevel = postingPermissionLevel; }

    public String getCustomFields() { return customFields; }
    public void setCustomFields(String customFields) { this.customFields = customFields; }

    public OffsetDateTime getLastModified() { return lastModified; }
    public void setLastModified(OffsetDateTime lastModified) { this.lastModified = lastModified; }

    public Integer getSlaDays() { return slaDays; }
    public void setSlaDays(Integer slaDays) { this.slaDays = slaDays; }

    public String getNotificationReplyEmail() { return notificationReplyEmail; }
    public void setNotificationReplyEmail(String notificationReplyEmail) { this.notificationReplyEmail = notificationReplyEmail; }

    public Boolean getAutoCloseIsActive() { return autoCloseIsActive; }
    public void setAutoCloseIsActive(Boolean autoCloseIsActive) { this.autoCloseIsActive = autoCloseIsActive; }

    public Integer getAutoCloseSubstatusId() { return autoCloseSubstatusId; }
    public void setAutoCloseSubstatusId(Integer autoCloseSubstatusId) { this.autoCloseSubstatusId = autoCloseSubstatusId; }
}
