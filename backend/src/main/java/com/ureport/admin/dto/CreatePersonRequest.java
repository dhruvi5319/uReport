package com.ureport.admin.dto;

import java.util.List;

/**
 * Request body for POST /api/people — create a new person.
 */
public class CreatePersonRequest {

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
