package com.ureport.admin.dto;

import java.util.List;

/**
 * Paginated list of persons for GET /api/people.
 */
public class PersonPageDto {

    public List<PersonListItemDto> data;
    public long total;
    public int page;
    public int pageSize;

    public PersonPageDto() {}

    public PersonPageDto(List<PersonListItemDto> data, long total, int page, int pageSize) {
        this.data = data;
        this.total = total;
        this.page = page;
        this.pageSize = pageSize;
    }
}
