package com.ureport.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

/**
 * Request body for PUT /api/departments/{id}.
 *
 * All fields are full-replacement (not PATCH) — same shape as CreateDepartmentRequest.
 * The actionIds list fully replaces the existing department_actions join rows (reconciliation).
 */
public class UpdateDepartmentRequest {

    @NotBlank(message = "name is required")
    @Size(max = 128, message = "name must not exceed 128 characters")
    public String name;

    /** Optional: ID of the Person to set as the default person. Null clears the assignment. */
    public Long defaultPersonId;

    /** Full replacement list of Action IDs for the department. Empty list removes all associations. */
    public List<Long> actionIds = new ArrayList<>();
}
