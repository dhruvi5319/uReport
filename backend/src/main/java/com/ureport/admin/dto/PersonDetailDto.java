package com.ureport.admin.dto;

import java.util.List;

/**
 * Full person detail DTO — returned by POST, GET/{id}, and PUT/{id} endpoints.
 * Includes nested email/phone/address arrays.
 */
public class PersonDetailDto {

    public Long id;
    public String firstname;
    public String middlename;
    public String lastname;
    public String organization;

    // Top-level legacy address fields
    public String address;
    public String city;
    public String state;
    public String zip;

    public DepartmentRef department;
    public String username;
    public String role;

    public List<PersonEmailDto> emails;
    public List<PersonPhoneDto> phones;
    public List<PersonAddressDto> addresses;

    /**
     * Lightweight {id, name} department reference.
     */
    public static class DepartmentRef {
        public Long id;
        public String name;

        public DepartmentRef() {}

        public DepartmentRef(Long id, String name) {
            this.id = id;
            this.name = name;
        }
    }
}
