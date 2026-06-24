package com.ureport.dto.request;

import jakarta.validation.constraints.NotNull;

public record CloseTicketRequest(
        @NotNull Integer substatusId,
        String notes
) {}
