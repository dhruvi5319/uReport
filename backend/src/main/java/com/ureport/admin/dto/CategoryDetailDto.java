package com.ureport.admin.dto;

import java.util.List;

/**
 * Full detail DTO for a Category.
 *
 * Contract (05-03 integration_contracts):
 *   { id, name, description, department:{id,name}, defaultPerson:{id,firstname,lastname},
 *     categoryGroup:{id,name}, active, featured, displayPermissionLevel, postingPermissionLevel,
 *     slaDays, notificationReplyEmail, autoCloseIsActive, autoCloseSubstatusId,
 *     actionResponses:[{id,actionId,template,replyEmail}] }
 */
public class CategoryDetailDto {

    public Long id;
    public String name;
    public String description;
    public DepartmentRef department;
    public PersonRef defaultPerson;
    public CategoryGroupRef categoryGroup;
    public boolean active;
    public boolean featured;
    public String displayPermissionLevel;
    public String postingPermissionLevel;
    public Integer slaDays;
    public String notificationReplyEmail;
    public boolean autoCloseIsActive;
    public Long autoCloseSubstatusId;
    public List<CategoryActionResponseDto> actionResponses;

    public CategoryDetailDto() {}

    /** Nested reference for a department. */
    public static class DepartmentRef {
        public Long id;
        public String name;

        public DepartmentRef() {}

        public DepartmentRef(Long id, String name) {
            this.id = id;
            this.name = name;
        }
    }

    /** Nested reference for a person (defaultPerson). */
    public static class PersonRef {
        public Long id;
        public String firstname;
        public String lastname;

        public PersonRef() {}

        public PersonRef(Long id, String firstname, String lastname) {
            this.id = id;
            this.firstname = firstname;
            this.lastname = lastname;
        }
    }

    /** Nested reference for a category group. */
    public static class CategoryGroupRef {
        public Long id;
        public String name;

        public CategoryGroupRef() {}

        public CategoryGroupRef(Long id, String name) {
            this.id = id;
            this.name = name;
        }
    }
}
