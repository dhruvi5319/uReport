package com.ureport.admin.dto;

/**
 * Lightweight list item DTO for departments.
 * Used in GET /api/departments (list) — same as DepartmentDetailDto but without actionIds for lighter payload.
 * Currently the service returns DepartmentDetailDto for both list and single-item responses
 * (consistent shape, allows client to show actionIds in list view).
 */
public class DepartmentListItemDto {

    public Long id;
    public String name;
    public DepartmentDetailDto.PersonRef defaultPerson;
    public long categoryCount;

    public DepartmentListItemDto() {}

    public DepartmentListItemDto(Long id, String name,
                                  DepartmentDetailDto.PersonRef defaultPerson,
                                  long categoryCount) {
        this.id = id;
        this.name = name;
        this.defaultPerson = defaultPerson;
        this.categoryCount = categoryCount;
    }
}
