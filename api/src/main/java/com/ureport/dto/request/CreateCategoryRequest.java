package com.ureport.dto.request;

import jakarta.validation.constraints.NotBlank;

public class CreateCategoryRequest {

    @NotBlank
    private String name;
    private String description;
    private Integer department_id;
    private Integer defaultPerson_id;
    private Integer categoryGroup_id;
    private Boolean active;
    private Boolean featured;
    private String displayPermissionLevel;
    private String postingPermissionLevel;
    private String customFields;
    private Integer slaDays;
    private String notificationReplyEmail;
    private Boolean autoCloseIsActive;
    private Integer autoCloseSubstatus_id;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getDepartment_id() { return department_id; }
    public void setDepartment_id(Integer department_id) { this.department_id = department_id; }

    public Integer getDefaultPerson_id() { return defaultPerson_id; }
    public void setDefaultPerson_id(Integer defaultPerson_id) { this.defaultPerson_id = defaultPerson_id; }

    public Integer getCategoryGroup_id() { return categoryGroup_id; }
    public void setCategoryGroup_id(Integer categoryGroup_id) { this.categoryGroup_id = categoryGroup_id; }

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

    public Integer getSlaDays() { return slaDays; }
    public void setSlaDays(Integer slaDays) { this.slaDays = slaDays; }

    public String getNotificationReplyEmail() { return notificationReplyEmail; }
    public void setNotificationReplyEmail(String notificationReplyEmail) { this.notificationReplyEmail = notificationReplyEmail; }

    public Boolean getAutoCloseIsActive() { return autoCloseIsActive; }
    public void setAutoCloseIsActive(Boolean autoCloseIsActive) { this.autoCloseIsActive = autoCloseIsActive; }

    public Integer getAutoCloseSubstatus_id() { return autoCloseSubstatus_id; }
    public void setAutoCloseSubstatus_id(Integer autoCloseSubstatus_id) { this.autoCloseSubstatus_id = autoCloseSubstatus_id; }
}
