package com.ureport.crm.dto;

/**
 * DTO for an action type — used by GET /api/actions.
 *
 * isDepartmentAction: true when action.type = 'department'; false for system actions.
 * (All 10 system actions + any custom department actions are returned.)
 */
public record ActionDto(Long id, String name, String replyEmail, Boolean isDepartmentAction) {}
