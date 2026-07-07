package com.ureport.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "actions")
public class Action {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private String type;
    private String template;

    @Column(name = "reply_email")
    private String replyEmail;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getTemplate() { return template; }
    public void setTemplate(String template) { this.template = template; }
    public String getReplyEmail() { return replyEmail; }
    public void setReplyEmail(String replyEmail) { this.replyEmail = replyEmail; }
}
