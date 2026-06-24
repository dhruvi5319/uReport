package com.ureport.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "substatus")
public class Substatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    // CHECK(status IN ('open','closed'))
    @Column(name = "status", nullable = false, length = 10)
    private String status;

    @Column(name = "isDefault", nullable = false, columnDefinition = "BOOLEAN DEFAULT false")
    private boolean isDefault;

    @Column(name = "isSystem", nullable = false, columnDefinition = "BOOLEAN DEFAULT false")
    private boolean isSystem;

    // Getters and setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public boolean isDefault() { return isDefault; }
    public void setDefault(boolean isDefault) { this.isDefault = isDefault; }

    /** Alias for backward compatibility with Boolean getIsDefault() */
    public Boolean getIsDefault() { return isDefault; }
    public void setIsDefault(Boolean isDefault) { this.isDefault = isDefault != null && isDefault; }

    public boolean isSystem() { return isSystem; }
    public void setSystem(boolean isSystem) { this.isSystem = isSystem; }

    /** Alias for backward compatibility with Boolean getIsSystem() */
    public Boolean getIsSystem() { return isSystem; }
    public void setIsSystem(Boolean isSystem) { this.isSystem = isSystem != null && isSystem; }
}
