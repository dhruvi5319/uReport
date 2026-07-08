package com.ureport.admin.dto;

/**
 * Request body for PUT /api/actions/{id}.
 * Updates template and replyEmail only — name, description, and type are immutable via this endpoint.
 */
public class UpdateActionRequest {

    public String template;   // nullable — clears template if null

    public String replyEmail; // nullable
}
