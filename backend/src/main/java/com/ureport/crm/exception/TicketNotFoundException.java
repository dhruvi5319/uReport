package com.ureport.crm.exception;

public class TicketNotFoundException extends RuntimeException {
    private final String code;

    public TicketNotFoundException(Long id) {
        super("Ticket not found: " + id);
        this.code = "TICKET_NOT_FOUND";
    }

    public String getCode() { return code; }
}
