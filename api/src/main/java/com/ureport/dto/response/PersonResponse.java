package com.ureport.dto.response;

import java.util.List;

public class PersonResponse {

    private Integer id;
    private String firstname;
    private String middlename;
    private String lastname;
    private String organization;
    private String address;
    private String city;
    private String state;
    private String zip;
    private Integer department_id;
    private String departmentName;
    private String username;
    private String role;
    private List<PersonEmailDTO> emails;
    private List<PersonPhoneDTO> phones;
    private List<PersonAddressDTO> addresses;

    // Getters and setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getFirstname() { return firstname; }
    public void setFirstname(String firstname) { this.firstname = firstname; }

    public String getMiddlename() { return middlename; }
    public void setMiddlename(String middlename) { this.middlename = middlename; }

    public String getLastname() { return lastname; }
    public void setLastname(String lastname) { this.lastname = lastname; }

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

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public List<PersonEmailDTO> getEmails() { return emails; }
    public void setEmails(List<PersonEmailDTO> emails) { this.emails = emails; }

    public List<PersonPhoneDTO> getPhones() { return phones; }
    public void setPhones(List<PersonPhoneDTO> phones) { this.phones = phones; }

    public List<PersonAddressDTO> getAddresses() { return addresses; }
    public void setAddresses(List<PersonAddressDTO> addresses) { this.addresses = addresses; }

    // Nested DTOs
    public static class PersonEmailDTO {
        private Integer id;
        private String email;
        private String label;
        private boolean usedForNotifications;

        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }
        public boolean isUsedForNotifications() { return usedForNotifications; }
        public void setUsedForNotifications(boolean usedForNotifications) { this.usedForNotifications = usedForNotifications; }
    }

    public static class PersonPhoneDTO {
        private Integer id;
        private String number;
        private String label;

        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }
        public String getNumber() { return number; }
        public void setNumber(String number) { this.number = number; }
        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }
    }

    public static class PersonAddressDTO {
        private Integer id;
        private String address;
        private String city;
        private String state;
        private String zip;
        private String label;

        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }
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
