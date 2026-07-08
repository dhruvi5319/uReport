package com.ureport.admin.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body for POST /api/substatuses and PUT /api/substatuses/{id}.
 */
public class CreateSubstatusRequest {

    @NotBlank
    public String name;

    public String description;

    @NotBlank
    public String status; // "open" | "closed"

    public boolean isDefault = false;
}
