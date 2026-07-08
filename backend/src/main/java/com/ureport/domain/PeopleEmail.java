package com.ureport.domain;

import jakarta.persistence.*;

/**
 * A notification email address for a person.
 * Maps to the people_emails table.
 */
@Entity
@Table(name = "people_emails")
public class PeopleEmail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "person_id", nullable = false)
    private Long personId;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String label = "Other";

    @Column(name = "used_for_notifications", nullable = false)
    private Boolean usedForNotifications = false;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPersonId() { return personId; }
    public void setPersonId(Long personId) { this.personId = personId; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public Boolean getUsedForNotifications() { return usedForNotifications; }
    public void setUsedForNotifications(Boolean usedForNotifications) { this.usedForNotifications = usedForNotifications; }
}
