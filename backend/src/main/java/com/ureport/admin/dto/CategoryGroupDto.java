package com.ureport.admin.dto;

/**
 * DTO for a category group (simple: id, name, ordering).
 */
public record CategoryGroupDto(Long id, String name, Short ordering) {}
