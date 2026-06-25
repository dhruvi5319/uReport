package com.ureport.dto.response;

import java.time.OffsetDateTime;

public record HistoryEntryResponse(
        Long id,
        Long ticketId,
        Integer enteredByPersonId,
        String enteredByPersonName,
        Integer actionPersonId,
        String actionPersonName,
        Integer actionId,
        String actionName,
        OffsetDateTime enteredDate,
        OffsetDateTime actionDate,
        String notes,
        String data,
        String renderedDescription
) {}
