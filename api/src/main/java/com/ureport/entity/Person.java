package com.ureport.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "people")
public class Person {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "firstname", nullable = false, length = 100)
    private String firstname;

    @Column(name = "middlename", length = 100)
    private String middlename;

    @Column(name = "lastname", nullable = false, length = 100)
    private String lastname;

    @Column(name = "organization", length = 200)
    private String organization;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 2)
    private String state;

    @Column(name = "zip", length = 10)
    private String zip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "username", unique = true, length = 100)
    private String username;

    @Column(name = "passwordHash", length = 255)
    private String passwordHash;

    @Column(name = "role", length = 20)
    private String role;

    @Column(name = "deletedAt", columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime deletedAt;

    @OneToMany(mappedBy = "person", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PeopleEmail> emails = new ArrayList<>();

    @OneToMany(mappedBy = "person", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PeoplePhone> phones = new ArrayList<>();

    @OneToMany(mappedBy = "person", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PeopleAddress> addresses = new ArrayList<>();

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

    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }

    /** Backward-compatible helper used by existing code */
    public Integer getDepartmentId() {
        return department != null ? department.getId() : null;
    }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public OffsetDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(OffsetDateTime deletedAt) { this.deletedAt = deletedAt; }

    public List<PeopleEmail> getEmails() { return emails; }
    public void setEmails(List<PeopleEmail> emails) { this.emails = emails; }

    public List<PeoplePhone> getPhones() { return phones; }
    public void setPhones(List<PeoplePhone> phones) { this.phones = phones; }

    public List<PeopleAddress> getAddresses() { return addresses; }
    public void setAddresses(List<PeopleAddress> addresses) { this.addresses = addresses; }

    public String getFullName() {
        StringBuilder sb = new StringBuilder();
        if (firstname != null) sb.append(firstname);
        if (middlename != null && !middlename.isBlank()) sb.append(" ").append(middlename);
        if (lastname != null) sb.append(" ").append(lastname);
        return sb.toString().trim();
    }
}
