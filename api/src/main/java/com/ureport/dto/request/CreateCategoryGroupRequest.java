package com.ureport.dto.request;

import jakarta.validation.constraints.NotBlank;

public class CreateCategoryGroupRequest {

    @NotBlank
    private String name;
    private Integer ordering;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getOrdering() { return ordering; }
    public void setOrdering(Integer ordering) { this.ordering = ordering; }
}
