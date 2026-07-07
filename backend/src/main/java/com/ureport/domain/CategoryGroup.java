package com.ureport.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "category_groups")
public class CategoryGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private Short ordering;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Short getOrdering() { return ordering; }
    public void setOrdering(Short ordering) { this.ordering = ordering; }
}
