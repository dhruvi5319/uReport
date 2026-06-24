package com.ureport.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "peopleEmails")
public class PeopleEmail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_id", nullable = false)
    private Person person;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "label", length = 50)
    private String label;

    @Column(name = "usedForNotifications", nullable = false, columnDefinition = "BOOLEAN DEFAULT false")
    private boolean usedForNotifications;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Person getPerson() { return person; }
    public void setPerson(Person person) { this.person = person; }

    /** Backward-compatible helper used by existing code */
    public Integer getPersonId() {
        return person != null ? person.getId() : null;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public boolean isUsedForNotifications() { return usedForNotifications; }
    public void setUsedForNotifications(boolean usedForNotifications) { this.usedForNotifications = usedForNotifications; }
}
