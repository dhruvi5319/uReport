package com.ureport.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_group_id")
    private CategoryGroup categoryGroup;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    private Boolean active;

    @Column(name = "display_permission_level")
    private String displayPermissionLevel;

    @Column(name = "posting_permission_level")
    private String postingPermissionLevel;

    @Column(name = "sla_days")
    private Integer slaDays;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public CategoryGroup getCategoryGroup() { return categoryGroup; }
    public void setCategoryGroup(CategoryGroup categoryGroup) { this.categoryGroup = categoryGroup; }

    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public String getDisplayPermissionLevel() { return displayPermissionLevel; }
    public void setDisplayPermissionLevel(String displayPermissionLevel) { this.displayPermissionLevel = displayPermissionLevel; }

    public String getPostingPermissionLevel() { return postingPermissionLevel; }
    public void setPostingPermissionLevel(String postingPermissionLevel) { this.postingPermissionLevel = postingPermissionLevel; }

    public Integer getSlaDays() { return slaDays; }
    public void setSlaDays(Integer slaDays) { this.slaDays = slaDays; }
}
