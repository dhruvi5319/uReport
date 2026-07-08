package com.ureport.admin.dto;

/**
 * DTO for a person's email address (used in create/update requests and responses).
 */
public class PersonEmailDto {
    public Long id;
    public String email;
    public String label;
    public boolean usedForNotifications;

    public PersonEmailDto() {}

    public PersonEmailDto(Long id, String email, String label, boolean usedForNotifications) {
        this.id = id;
        this.email = email;
        this.label = label;
        this.usedForNotifications = usedForNotifications;
    }
}
