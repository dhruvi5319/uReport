package com.ureport.domain;

import jakarta.persistence.*;

/**
 * A postal address for a person.
 * Maps to the people_addresses table.
 */
@Entity
@Table(name = "people_addresses")
public class PeopleAddress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_id", nullable = false)
    private Person person;

    private String address;
    private String city;
    private String state;
    private String zip;
    private String label;

    public PeopleAddress() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Person getPerson() { return person; }
    public void setPerson(Person person) { this.person = person; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getZip() { return zip; }
    public void setZip(String zip) { this.zip = zip; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
}
