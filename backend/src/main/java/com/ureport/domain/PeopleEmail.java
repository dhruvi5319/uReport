package com.ureport.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "people_emails")
public class PeopleEmail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "person_id")
    private Long personId;

    private String email;
    private String label;

    @Column(name = "used_for_notifications")
    private Boolean usedForNotifications;

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
