package com.ureport.domain;

import jakarta.persistence.*;

/**
 * JPA entity mapping to the bookmarks table.
 *
 * Bookmarks are scoped to a person (personId from JWT) and store named search queries
 * or any request URI for quick recall. Ownership is enforced in BookmarkService
 * (T-06-02, T-06-03).
 */
@Entity
@Table(name = "bookmarks")
public class Bookmark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The person who owns this bookmark.
     * Sourced exclusively from the validated JWT principal — never from request params.
     * This is the primary ownership guard (T-06-02).
     */
    @Column(name = "person_id", nullable = false)
    private Long personId;

    /**
     * Bookmark type — defaults to "search" for saved search queries.
     */
    @Column(name = "type", nullable = false, length = 50)
    private String type = "search";

    /**
     * Human-readable label for the bookmark.
     */
    @Column(name = "name", length = 255)
    private String name;

    /**
     * The request URI being bookmarked (e.g. /api/tickets?q=pothole&status=open).
     */
    @Column(name = "request_uri", nullable = false, columnDefinition = "TEXT")
    private String requestUri;

    // -----------------------------------------------------------------------
    // Getters / Setters
    // -----------------------------------------------------------------------

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPersonId() { return personId; }
    public void setPersonId(Long personId) { this.personId = personId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getRequestUri() { return requestUri; }
    public void setRequestUri(String requestUri) { this.requestUri = requestUri; }
}
