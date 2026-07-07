package com.ureport.crm.dto;

/**
 * Request body for PUT /api/clients/{id} — update an Open311 client.
 *
 * Only non-null fields are applied. The api_key is never changed via update (T-04-22).
 */
public record UpdateClientRequest(
        String name,
        String url,
        Long contactPersonId,
        Long contactMethodId
) {}
