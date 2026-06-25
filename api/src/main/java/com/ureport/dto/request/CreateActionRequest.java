package com.ureport.dto.request;

import jakarta.validation.constraints.NotBlank;

public class CreateActionRequest {

    @NotBlank
    private String name;
    private String description;
    private String type; // must be 'department'
    private String template;
    private String replyEmail;

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
