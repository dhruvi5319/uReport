package com.ureport.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "clients")
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "url", length = 500)
    private String url;

    @Column(name = "api_key_hash", nullable = false, length = 255)
    private String apiKeyHash;

    @Column(name = "api_key_lookup", nullable = false, length = 64, unique = true)
    private String apiKeyLookup;

    @Column(name = "contactPerson_id")
    private Integer contactPersonId;

    @Column(name = "contactMethod_id")
    private Integer contactMethodId;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getApiKeyHash() { return apiKeyHash; }
    public void setApiKeyHash(String apiKeyHash) { this.apiKeyHash = apiKeyHash; }

    public String getApiKeyLookup() { return apiKeyLookup; }
    public void setApiKeyLookup(String apiKeyLookup) { this.apiKeyLookup = apiKeyLookup; }

    public Integer getContactPersonId() { return contactPersonId; }
    public void setContactPersonId(Integer contactPersonId) { this.contactPersonId = contactPersonId; }

    public Integer getContactMethodId() { return contactMethodId; }
    public void setContactMethodId(Integer contactMethodId) { this.contactMethodId = contactMethodId; }
}
