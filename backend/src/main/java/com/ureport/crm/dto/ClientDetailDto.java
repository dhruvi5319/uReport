package com.ureport.crm.dto;

/**
 * DTO for Open311 client detail.
 *
 * Security note (T-04-22):
 * - apiKey is present on POST create (the only time it is exposed in plaintext)
 * - GET list and GET /{id} return apiKey as null (masked)
 * - api_key is stored as-is in the DB per Open311 spec; clients send it as HTTP param
 */
public record ClientDetailDto(
        Long id,
        String name,
        String url,
        String apiKey,
        ContactRef contactPerson,
        ContactRef contactMethod
) {

    /**
     * Nested reference DTO for contact person and contact method.
     */
    public record ContactRef(Long id, String name) {}
}
