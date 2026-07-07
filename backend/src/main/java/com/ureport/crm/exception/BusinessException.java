package com.ureport.crm.exception;

import org.springframework.http.HttpStatus;

/**
 * General business logic exception returning a 400 with a code + message.
 */
public class BusinessException extends RuntimeException {
    private final String code;
    private final HttpStatus status;

    public BusinessException(String code, String message) {
        super(message);
        this.code = code;
        this.status = HttpStatus.BAD_REQUEST;
    }

    public BusinessException(String code, String message, HttpStatus status) {
        super(message);
        this.code = code;
        this.status = status;
    }

    public String getCode() { return code; }
    public HttpStatus getStatus() { return status; }
}
