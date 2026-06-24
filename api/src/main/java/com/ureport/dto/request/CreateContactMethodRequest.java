package com.ureport.dto.request;

import jakarta.validation.constraints.NotBlank;

public class CreateContactMethodRequest {

    @NotBlank
    private String name;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
