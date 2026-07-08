package com.ureport.admin.dto;

/**
 * Lightweight category item for list responses.
 *
 * Used by GET /api/categories and GET /api/categories/public.
 */
public class CategoryListItemDto {

    public Long id;
    public String name;
    public boolean active;
    public boolean featured;
    public CategoryDetailDto.DepartmentRef department;
    public CategoryDetailDto.CategoryGroupRef categoryGroup;

    public CategoryListItemDto() {}
}
