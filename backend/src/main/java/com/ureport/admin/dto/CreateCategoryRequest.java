package com.ureport.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

/**
 * Request DTO for POST /api/categories.
 */
public class CreateCategoryRequest {

    @NotBlank
    @Size(max = 50)
    public String name;

    public String description;

    @NotNull
    public Long departmentId;

    public Long defaultPersonId;
    public Long categoryGroupId;

    public boolean active = true;
    public boolean featured = false;

    public String displayPermissionLevel = "staff";
    public String postingPermissionLevel = "staff";

    public Integer slaDays;
    public String notificationReplyEmail;

    public boolean autoCloseIsActive = false;
    public Long autoCloseSubstatusId;

    public List<CategoryActionResponseDto> actionResponses = new ArrayList<>();
}
