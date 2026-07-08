package com.ureport.admin.dto;

import java.util.List;

/**
 * Request body for PUT /api/people/{id} — update an existing person.
 * Same shape as CreatePersonRequest — all fields are optional.
 */
public class UpdatePersonRequest {

    public String firstname;
    public String middlename;
    public String lastname;
    public String organization;

    // Top-level legacy address fields
    public String address;
    public String city;
    public String state;
    public String zip;

    public Long departmentId;
    public String username;
    public String role;

    public List<PersonEmailDto> emails;
    public List<PersonPhoneDto> phones;
    public List<PersonAddressDto> addresses;
}
