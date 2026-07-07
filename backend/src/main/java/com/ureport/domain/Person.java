package com.ureport.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "people")
public class Person {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "firstname", length = 40)
    private String firstname;

    @Column(name = "middlename", length = 40)
    private String middlename;

    @Column(name = "lastname", length = 40)
    private String lastname;

    @Column(name = "username", nullable = false, unique = true, length = 40)
    private String username;

    @Column(name = "role", nullable = false, length = 30)
    private String role;  // values: "admin", "staff", "public"

    @Column(name = "department_id")
    private Long departmentId;

    // Default constructor required by JPA
    public Person() {}

    public Person(String username, String role) {
        this.username = username;
        this.role = role;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFirstname() { return firstname; }
    public void setFirstname(String firstname) { this.firstname = firstname; }
    public String getMiddlename() { return middlename; }
    public void setMiddlename(String middlename) { this.middlename = middlename; }
    public String getLastname() { return lastname; }
    public void setLastname(String lastname) { this.lastname = lastname; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
}
