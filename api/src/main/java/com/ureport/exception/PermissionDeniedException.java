package com.ureport.exception;

public class PermissionDeniedException extends RuntimeException {

    private final String errorCode;

    public PermissionDeniedException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
