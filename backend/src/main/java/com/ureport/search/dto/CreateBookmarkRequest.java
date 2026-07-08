package com.ureport.search.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body for POST /api/bookmarks.
 */
public class CreateBookmarkRequest {

    @NotBlank(message = "name is required")
    @Size(max = 255, message = "name must not exceed 255 characters")
    private String name;

    @NotBlank(message = "requestUri is required")
    private String requestUri;

    /**
     * Bookmark type — defaults to "search" when not provided.
     */
    private String type = "search";

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getRequestUri() { return requestUri; }
    public void setRequestUri(String requestUri) { this.requestUri = requestUri; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
}
