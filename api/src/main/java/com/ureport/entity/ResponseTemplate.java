package com.ureport.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "responseTemplates")
public class ResponseTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "template", nullable = false, columnDefinition = "TEXT")
    private String template;

    @Column(name = "action_id")
    private Integer actionId;

    // Getters and setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getTemplate() { return template; }
    public void setTemplate(String template) { this.template = template; }

    public Integer getActionId() { return actionId; }
    public void setActionId(Integer actionId) { this.actionId = actionId; }
}
