package com.ureport.admin.dto;

/**
 * DTO for a person's postal address (used in create/update requests and responses).
 */
public class PersonAddressDto {
    public Long id;
    public String address;
    public String city;
    public String state;
    public String zip;
    public String label;

    public PersonAddressDto() {}

    public PersonAddressDto(Long id, String address, String city, String state, String zip, String label) {
        this.id = id;
        this.address = address;
        this.city = city;
        this.state = state;
        this.zip = zip;
        this.label = label;
    }
}
