package com.ureport.domain;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

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

    /**
     * Join table rows for department_actions.
     * DepartmentAction uses a composite @IdClass (Long departmentId + Long actionId)
     * without a @ManyToOne back-reference, so we use @JoinColumn instead of mappedBy.
     * CascadeType.ALL + orphanRemoval ensures that clearing this list removes the DB rows.
     */
    // Transient list — NOT persisted by Hibernate (managed directly via DepartmentActionRepository).
    // Loaded from repository after save for DTO mapping. Using @Transient avoids the
    // Hibernate NULL-FK-then-delete problem on composite PK join tables.
    @Transient
    private List<DepartmentAction> departmentActions = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Person getDefaultPerson() { return defaultPerson; }
    public void setDefaultPerson(Person defaultPerson) { this.defaultPerson = defaultPerson; }
    public List<DepartmentAction> getDepartmentActions() { return departmentActions; }
    public void setDepartmentActions(List<DepartmentAction> departmentActions) { this.departmentActions = departmentActions; }
}
