package com.ureport.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "clients")
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String url;

    @Column(name = "api_key")
    private String apiKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_person_id")
    private Person contactPerson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_method_id")
    private ContactMethod contactMethod;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }
    public Person getContactPerson() { return contactPerson; }
    public void setContactPerson(Person contactPerson) { this.contactPerson = contactPerson; }
    public ContactMethod getContactMethod() { return contactMethod; }
    public void setContactMethod(ContactMethod contactMethod) { this.contactMethod = contactMethod; }
}
