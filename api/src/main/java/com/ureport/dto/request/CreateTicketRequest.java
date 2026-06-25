package com.ureport.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateTicketRequest(
        @NotNull Integer categoryId,
        @NotBlank String description,
        Integer issueTypeId,
        Integer contactMethodId,
        Integer responseMethodId,
        Integer reportedByPersonId,
        String reporterEmail,
        String reporterFirstname,
        String reporterLastname,
        String location,
        String city,
        String state,
        String zip,
        BigDecimal latitude,
        BigDecimal longitude,
        Integer addressId,
        String additionalFields,
        String customFields
) {}
