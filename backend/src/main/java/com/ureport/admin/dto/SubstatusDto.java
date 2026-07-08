package com.ureport.admin.dto;

/**
 * DTO for a substatus record.
 */
public record SubstatusDto(Long id, String name, String description, String status, Boolean isDefault) {}
