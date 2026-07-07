package com.ureport.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_person_id")
    private Person defaultPerson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_group_id")
    private CategoryGroup categoryGroup;

    private Boolean active;
    private Boolean featured;

    @Column(name = "display_permission_level")
    private String displayPermissionLevel;

    @Column(name = "posting_permission_level")
    private String postingPermissionLevel;

    @Column(name = "custom_fields")
    private String customFields;

    @Column(name = "last_modified")
    private LocalDateTime lastModified;

    @Column(name = "sla_days")
    private Integer slaDays;

    @Column(name = "notification_reply_email")
    private String notificationReplyEmail;

    @Column(name = "auto_close_is_active")
    private Boolean autoCloseIsActive;

    @Column(name = "auto_close_substatus_id")
    private Long autoCloseSubstatusId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }
    public Person getDefaultPerson() { return defaultPerson; }
    public void setDefaultPerson(Person defaultPerson) { this.defaultPerson = defaultPerson; }
    public CategoryGroup getCategoryGroup() { return categoryGroup; }
    public void setCategoryGroup(CategoryGroup categoryGroup) { this.categoryGroup = categoryGroup; }
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
    public LocalDateTime getLastModified() { return lastModified; }
    public void setLastModified(LocalDateTime lastModified) { this.lastModified = lastModified; }
    public Integer getSlaDays() { return slaDays; }
    public void setSlaDays(Integer slaDays) { this.slaDays = slaDays; }
    public String getNotificationReplyEmail() { return notificationReplyEmail; }
    public void setNotificationReplyEmail(String notificationReplyEmail) { this.notificationReplyEmail = notificationReplyEmail; }
    public Boolean getAutoCloseIsActive() { return autoCloseIsActive; }
    public void setAutoCloseIsActive(Boolean autoCloseIsActive) { this.autoCloseIsActive = autoCloseIsActive; }
    public Long getAutoCloseSubstatusId() { return autoCloseSubstatusId; }
    public void setAutoCloseSubstatusId(Long autoCloseSubstatusId) { this.autoCloseSubstatusId = autoCloseSubstatusId; }
}
