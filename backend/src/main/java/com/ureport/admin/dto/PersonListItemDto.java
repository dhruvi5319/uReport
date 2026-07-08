package com.ureport.admin.dto;

/**
 * Lightweight person DTO used in paginated list responses.
 */
public class PersonListItemDto {

    public Long id;
    public String firstname;
    public String lastname;
    public String organization;
    public String email;
    public String role;
    public PersonDetailDto.DepartmentRef department;

    public PersonListItemDto() {}

    public PersonListItemDto(Long id, String firstname, String lastname, String organization,
                              String email, String role, PersonDetailDto.DepartmentRef department) {
        this.id = id;
        this.firstname = firstname;
        this.lastname = lastname;
        this.organization = organization;
        this.email = email;
        this.role = role;
        this.department = department;
    }
}
