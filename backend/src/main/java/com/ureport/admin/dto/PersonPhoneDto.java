package com.ureport.admin.dto;

/**
 * DTO for a person's phone number (used in create/update requests and responses).
 */
public class PersonPhoneDto {
    public Long id;
    public String number;
    public String label;

    public PersonPhoneDto() {}

    public PersonPhoneDto(Long id, String number, String label) {
        this.id = id;
        this.number = number;
        this.label = label;
    }
}
