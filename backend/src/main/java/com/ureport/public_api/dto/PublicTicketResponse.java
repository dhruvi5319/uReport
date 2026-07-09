package com.ureport.public_api.dto;

/**
 * Response body for POST /api/tickets/public.
 * Matches frontend expectation: { id: number, ticketId: string }
 */
public class PublicTicketResponse {

    private Long id;
    private String ticketId;   // "SR-{id}" format (Open311-style human-readable ID)

    public PublicTicketResponse(Long id, String ticketId) {
        this.id = id;
        this.ticketId = ticketId;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTicketId() { return ticketId; }
    public void setTicketId(String ticketId) { this.ticketId = ticketId; }
}
