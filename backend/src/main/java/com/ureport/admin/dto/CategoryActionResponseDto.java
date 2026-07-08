package com.ureport.admin.dto;

/**
 * DTO for a category-specific action response template.
 * Used in CategoryDetailDto.actionResponses list and as standalone response from
 * GET /api/categories/{id}/action-responses/{actionId}.
 */
public record CategoryActionResponseDto(Long id, Long actionId, String template, String replyEmail) {}
