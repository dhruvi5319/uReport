package com.ureport.search.dto;

/**
 * Response DTO for bookmark resources.
 * Returned by GET /api/bookmarks, POST /api/bookmarks.
 */
public class BookmarkDto {

    private Long id;
    private String type;
    private String name;
    private String requestUri;

    public BookmarkDto() {}

    public BookmarkDto(Long id, String type, String name, String requestUri) {
        this.id = id;
        this.type = type;
        this.name = name;
        this.requestUri = requestUri;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getRequestUri() { return requestUri; }
    public void setRequestUri(String requestUri) { this.requestUri = requestUri; }
}
