package com.ureport.crm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request body for POST /api/clients — create a new Open311 client.
 *
 * A UUID api_key is generated server-side on create (T-04-22 — not guessable).
 */
public record CreateClientRequest(
        @NotBlank String name,
        String url,
        @NotNull Long contactPersonId,
        Long contactMethodId
) {}
