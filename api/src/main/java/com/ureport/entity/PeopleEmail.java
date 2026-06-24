package com.ureport.entity;

import jakarta.persistence.*;

/**
 * Stub entity for peopleEmails table.
 * Wave 2c (People Management) will add full management methods.
 */
@Entity
@Table(name = "peopleEmails")
public class PeopleEmail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "person_id", nullable = false)
    private Integer personId;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "label", length = 50)
    private String label;

    @Column(name = "usedForNotifications")
    private Boolean usedForNotifications;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getPersonId() { return personId; }
    public void setPersonId(Integer personId) { this.personId = personId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public Boolean getUsedForNotifications() { return usedForNotifications; }
    public void setUsedForNotifications(Boolean usedForNotifications) { this.usedForNotifications = usedForNotifications; }
}
