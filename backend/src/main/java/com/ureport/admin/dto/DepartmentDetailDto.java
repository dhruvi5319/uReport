package com.ureport.admin.dto;

import java.util.List;

/**
 * Full detail DTO for a Department.
 * Includes defaultPerson reference, category count, and associated actionIds.
 *
 * Contract (05-02 integration_contracts):
 *   { id, name, defaultPerson:{id,firstname,lastname}, categoryCount, actionIds:[Long] }
 */
public class DepartmentDetailDto {

    public Long id;
    public String name;
    /** Null if no default person is assigned to the department. */
    public PersonRef defaultPerson;
    /** Count of categories that reference this department. */
    public long categoryCount;
    /** IDs of Actions associated with this department via department_actions join table. */
    public List<Long> actionIds;

    public DepartmentDetailDto() {}

    public DepartmentDetailDto(Long id, String name, PersonRef defaultPerson,
                                long categoryCount, List<Long> actionIds) {
        this.id = id;
        this.name = name;
        this.defaultPerson = defaultPerson;
        this.categoryCount = categoryCount;
        this.actionIds = actionIds;
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
}
