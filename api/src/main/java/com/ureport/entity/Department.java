package com.ureport.entity;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "departments")
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "defaultPerson_id")
    private Person defaultPerson;

    @ManyToMany
    @JoinTable(
        name = "department_categories",
        joinColumns = @JoinColumn(name = "department_id"),
        inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    private Set<Category> categories = new HashSet<>();

    @ManyToMany
    @JoinTable(
        name = "department_actions",
        joinColumns = @JoinColumn(name = "department_id"),
        inverseJoinColumns = @JoinColumn(name = "action_id")
    )
    private Set<Action> actions = new HashSet<>();

    // Getters and setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Person getDefaultPerson() { return defaultPerson; }
    public void setDefaultPerson(Person defaultPerson) { this.defaultPerson = defaultPerson; }

    public Set<Category> getCategories() { return categories; }
    public void setCategories(Set<Category> categories) { this.categories = categories; }

    public Set<Action> getActions() { return actions; }
    public void setActions(Set<Action> actions) { this.actions = actions; }
}
