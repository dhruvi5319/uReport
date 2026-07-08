package com.ureport.admin.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body for POST /api/actions.
 * Creates a department-type action only — the type field is hard-coded server-side.
 */
public class CreateActionRequest {

    @NotBlank
    public String name;

    public String description;

    public String template;

    public String replyEmail;

    // type is always "department" — do not accept from client
}
