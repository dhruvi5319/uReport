package com.ureport.domain;

import jakarta.persistence.*;

/**
 * Response template for a specific category+action pair.
 * Maps to the category_action_responses table.
 */
@Entity
@Table(name = "category_action_responses")
public class CategoryActionResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @Column(name = "action_id", nullable = false)
    private Long actionId;

    private String template;

    @Column(name = "reply_email")
    private String replyEmail;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public Long getActionId() { return actionId; }
    public void setActionId(Long actionId) { this.actionId = actionId; }
    public String getTemplate() { return template; }
    public void setTemplate(String template) { this.template = template; }
    public String getReplyEmail() { return replyEmail; }
    public void setReplyEmail(String replyEmail) { this.replyEmail = replyEmail; }
}
