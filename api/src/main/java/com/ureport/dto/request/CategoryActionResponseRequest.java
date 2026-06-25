package com.ureport.dto.request;

public class CategoryActionResponseRequest {

    private Integer actionId;
    private String template;
    private String replyEmail;

    public Integer getActionId() { return actionId; }
    public void setActionId(Integer actionId) { this.actionId = actionId; }

    public String getTemplate() { return template; }
    public void setTemplate(String template) { this.template = template; }

    public String getReplyEmail() { return replyEmail; }
    public void setReplyEmail(String replyEmail) { this.replyEmail = replyEmail; }
}
