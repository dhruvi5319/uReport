package com.ureport.dto.request;

import jakarta.validation.constraints.NotBlank;

public class CreateDepartmentRequest {

    @NotBlank
    private String name;
    private Integer defaultPerson_id;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getDefaultPerson_id() { return defaultPerson_id; }
    public void setDefaultPerson_id(Integer defaultPerson_id) { this.defaultPerson_id = defaultPerson_id; }
}
