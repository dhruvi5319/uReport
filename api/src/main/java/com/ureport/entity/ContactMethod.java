package com.ureport.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "contactMethods")
public class ContactMethod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name;

    @Column(name = "isSystem", nullable = false, columnDefinition = "BOOLEAN DEFAULT false")
    private boolean isSystem;

    // Getters and setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public boolean isSystem() { return isSystem; }
    public void setSystem(boolean system) { isSystem = system; }
}
