package com.ureport.dto.response;

import java.time.OffsetDateTime;
import java.util.List;

public class CategoryResponse {

    private Integer id;
    private String name;
    private String description;
    private Integer department_id;
    private String departmentName;
    private Integer defaultPerson_id;
    private String defaultPersonName;
    private Integer categoryGroup_id;
    private String categoryGroupName;
    private Boolean active;
    private Boolean featured;
    private String displayPermissionLevel;
    private String postingPermissionLevel;
    private String customFields;
    private OffsetDateTime lastModified;
    private Integer slaDays;
    private String notificationReplyEmail;
    private Boolean autoCloseIsActive;
    private Integer autoCloseSubstatus_id;
    private List<CategoryActionResponseDTO> actionResponses;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getDepartment_id() { return department_id; }
    public void setDepartment_id(Integer department_id) { this.department_id = department_id; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public Integer getDefaultPerson_id() { return defaultPerson_id; }
    public void setDefaultPerson_id(Integer defaultPerson_id) { this.defaultPerson_id = defaultPerson_id; }

    public String getDefaultPersonName() { return defaultPersonName; }
    public void setDefaultPersonName(String defaultPersonName) { this.defaultPersonName = defaultPersonName; }

    public Integer getCategoryGroup_id() { return categoryGroup_id; }
    public void setCategoryGroup_id(Integer categoryGroup_id) { this.categoryGroup_id = categoryGroup_id; }

    public String getCategoryGroupName() { return categoryGroupName; }
    public void setCategoryGroupName(String categoryGroupName) { this.categoryGroupName = categoryGroupName; }

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

    public Integer getAutoCloseSubstatus_id() { return autoCloseSubstatus_id; }
    public void setAutoCloseSubstatus_id(Integer autoCloseSubstatus_id) { this.autoCloseSubstatus_id = autoCloseSubstatus_id; }

    public List<CategoryActionResponseDTO> getActionResponses() { return actionResponses; }
    public void setActionResponses(List<CategoryActionResponseDTO> actionResponses) { this.actionResponses = actionResponses; }

    public static class CategoryActionResponseDTO {
        private Integer id;
        private Integer action_id;
        private String actionName;
        private String template;
        private String replyEmail;

        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }

        public Integer getAction_id() { return action_id; }
        public void setAction_id(Integer action_id) { this.action_id = action_id; }

        public String getActionName() { return actionName; }
        public void setActionName(String actionName) { this.actionName = actionName; }

        public String getTemplate() { return template; }
        public void setTemplate(String template) { this.template = template; }

        public String getReplyEmail() { return replyEmail; }
        public void setReplyEmail(String replyEmail) { this.replyEmail = replyEmail; }
    }
}
