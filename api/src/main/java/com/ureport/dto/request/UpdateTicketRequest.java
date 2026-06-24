package com.ureport.dto.request;

import java.math.BigDecimal;

public record UpdateTicketRequest(
        Integer categoryId,
        String description,
        Integer issueTypeId,
        Integer contactMethodId,
        Integer responseMethodId,
        String location,
        String city,
        String state,
        String zip,
        BigDecimal latitude,
        BigDecimal longitude,
        Integer addressId,
        String additionalFields,
        String customFields,
        String notes
) {}
