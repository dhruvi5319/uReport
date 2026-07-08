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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_id", nullable = false)
    private Person person;

    @Column(nullable = false)
    private String email;

    private String label;

    @Column(name = "used_for_notifications", nullable = false)
    private Boolean usedForNotifications = false;

    public PeopleEmail() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Person getPerson() { return person; }
    public void setPerson(Person person) { this.person = person; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public Boolean getUsedForNotifications() { return usedForNotifications; }
    public void setUsedForNotifications(Boolean usedForNotifications) { this.usedForNotifications = usedForNotifications; }
}
