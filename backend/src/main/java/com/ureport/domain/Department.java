package com.ureport.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "departments")
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_person_id")
    private Person defaultPerson;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Person getDefaultPerson() { return defaultPerson; }
    public void setDefaultPerson(Person defaultPerson) { this.defaultPerson = defaultPerson; }
}
