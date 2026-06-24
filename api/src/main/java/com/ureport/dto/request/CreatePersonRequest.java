package com.ureport.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public class CreatePersonRequest {

    @NotBlank
    private String firstname;

    @NotBlank
    private String lastname;

    private String middlename;
    private String organization;
    private String address;
    private String city;
    private String state;
    private String zip;
    private Integer department_id;
    private String username;
    private String password; // plain text; service BCrypts it
    private String role;     // 'staff', 'public', 'anonymous'

    private List<CreateEmailRequest> emails;
    private List<CreatePhoneRequest> phones;
    private List<CreateAddressRequest> addresses;

    // Getters and setters
    public String getFirstname() { return firstname; }
    public void setFirstname(String firstname) { this.firstname = firstname; }

    public String getLastname() { return lastname; }
    public void setLastname(String lastname) { this.lastname = lastname; }

    public String getMiddlename() { return middlename; }
    public void setMiddlename(String middlename) { this.middlename = middlename; }

    public String getOrganization() { return organization; }
    public void setOrganization(String organization) { this.organization = organization; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getZip() { return zip; }
    public void setZip(String zip) { this.zip = zip; }

    public Integer getDepartment_id() { return department_id; }
    public void setDepartment_id(Integer department_id) { this.department_id = department_id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public List<CreateEmailRequest> getEmails() { return emails; }
    public void setEmails(List<CreateEmailRequest> emails) { this.emails = emails; }

    public List<CreatePhoneRequest> getPhones() { return phones; }
    public void setPhones(List<CreatePhoneRequest> phones) { this.phones = phones; }

    public List<CreateAddressRequest> getAddresses() { return addresses; }
    public void setAddresses(List<CreateAddressRequest> addresses) { this.addresses = addresses; }

    // Nested request classes
    public static class CreateEmailRequest {
        private String email;
        private String label;
        private boolean usedForNotifications;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }
        public boolean isUsedForNotifications() { return usedForNotifications; }
        public void setUsedForNotifications(boolean usedForNotifications) { this.usedForNotifications = usedForNotifications; }
    }

    public static class CreatePhoneRequest {
        private String number;
        private String label;

        public String getNumber() { return number; }
        public void setNumber(String number) { this.number = number; }
        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }
    }

    public static class CreateAddressRequest {
        private String address;
        private String city;
        private String state;
        private String zip;
        private String label;

        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }
        public String getState() { return state; }
        public void setState(String state) { this.state = state; }
        public String getZip() { return zip; }
        public void setZip(String zip) { this.zip = zip; }
        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }
    }
}
