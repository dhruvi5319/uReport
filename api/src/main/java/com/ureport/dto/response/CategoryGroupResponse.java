package com.ureport.dto.response;

import java.util.List;

public class CategoryGroupResponse {

    private Integer id;
    private String name;
    private Integer ordering;
    private List<CategoryResponse> categories;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getOrdering() { return ordering; }
    public void setOrdering(Integer ordering) { this.ordering = ordering; }

    public List<CategoryResponse> getCategories() { return categories; }
    public void setCategories(List<CategoryResponse> categories) { this.categories = categories; }
}
