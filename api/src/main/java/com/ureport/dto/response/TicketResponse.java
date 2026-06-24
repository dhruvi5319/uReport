package com.ureport.dto.response;

import com.ureport.entity.Ticket;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record TicketResponse(
        Long id,
        Long parentId,
        Integer categoryId,
        Integer issueTypeId,
        Integer clientId,
        Integer enteredByPersonId,
        Integer reportedByPersonId,
        Integer assignedPersonId,
        Integer contactMethodId,
        Integer responseMethodId,
        OffsetDateTime enteredDate,
        OffsetDateTime lastModified,
        Integer addressId,
        BigDecimal latitude,
        BigDecimal longitude,
        String location,
        String city,
        String state,
        String zip,
        String status,
        OffsetDateTime closedDate,
        Integer substatusId,
        String additionalFields,
        String customFields,
        String description,
        int historyCount,
        int mediaCount
) {
    public static TicketResponse from(Ticket ticket) {
        return new TicketResponse(
                ticket.getId(),
                ticket.getParentId(),
                ticket.getCategoryId(),
                ticket.getIssueTypeId(),
                ticket.getClientId(),
                ticket.getEnteredByPersonId(),
                ticket.getReportedByPersonId(),
                ticket.getAssignedPersonId(),
                ticket.getContactMethodId(),
                ticket.getResponseMethodId(),
                ticket.getEnteredDate(),
                ticket.getLastModified(),
                ticket.getAddressId(),
                ticket.getLatitude(),
                ticket.getLongitude(),
                ticket.getLocation(),
                ticket.getCity(),
                ticket.getState(),
                ticket.getZip(),
                ticket.getStatus(),
                ticket.getClosedDate(),
                ticket.getSubstatusId(),
                ticket.getAdditionalFields(),
                ticket.getCustomFields(),
                ticket.getDescription(),
                0,  // historyCount populated separately
                0   // mediaCount populated separately
        );
    }
}
