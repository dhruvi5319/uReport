package com.ureport.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "category_action_responses",
    uniqueConstraints = @UniqueConstraint(columnNames = {"category_id", "action_id"}))
public class CategoryActionResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "action_id", nullable = false)
    private Action action;

    @Column(name = "template", columnDefinition = "TEXT")
    private String template;

    @Column(name = "replyEmail", length = 255)
    private String replyEmail;

    // Getters and setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }

    public Action getAction() { return action; }
    public void setAction(Action action) { this.action = action; }

    public String getTemplate() { return template; }
    public void setTemplate(String template) { this.template = template; }

    public String getReplyEmail() { return replyEmail; }
    public void setReplyEmail(String replyEmail) { this.replyEmail = replyEmail; }
}
