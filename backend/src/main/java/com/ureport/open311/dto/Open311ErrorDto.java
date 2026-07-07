package com.ureport.open311.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public class Open311ErrorDto {

    @JsonProperty("errors")
    private List<ErrorEntry> errors;

    public record ErrorEntry(String code, String description) {}

    public Open311ErrorDto() {}

    public static Open311ErrorDto of(String code, String description) {
        var dto = new Open311ErrorDto();
        dto.errors = List.of(new ErrorEntry(code, description));
        return dto;
    }

    public List<ErrorEntry> getErrors() { return errors; }
    public void setErrors(List<ErrorEntry> errors) { this.errors = errors; }
}
