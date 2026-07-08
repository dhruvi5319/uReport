package com.ureport.crm.dto;

/**
 * Lightweight DTO for GET /api/tickets list responses.
 *
 * searchSnippet is null when no `q` param is provided;
 * contains ts_headline output (HTML with &lt;mark&gt; tags) when FTS is active.
 */
public class TicketListItem {

    private Long id;
    private String status;
    private String description;
    private String location;
    private String enteredDate;
    private CategoryRef category;
    private PersonRef assignedPerson;

    /**
     * Full-text search snippet — null when q is absent; HTML with &lt;mark&gt; tags when FTS active.
     */
    private String searchSnippet;

    // -----------------------------------------------------------------------
    // Nested ref types
    // -----------------------------------------------------------------------

    public static class CategoryRef {
        private Long id;
        private String name;

        public CategoryRef() {}

        public CategoryRef(Long id, String name) {
            this.id = id;
            this.name = name;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }

    public static class PersonRef {
        private Long id;
        private String name;

        public PersonRef() {}

        public PersonRef(Long id, String name) {
            this.id = id;
            this.name = name;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }

    // -----------------------------------------------------------------------
    // Getters / Setters
    // -----------------------------------------------------------------------

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getEnteredDate() { return enteredDate; }
    public void setEnteredDate(String enteredDate) { this.enteredDate = enteredDate; }

    public CategoryRef getCategory() { return category; }
    public void setCategory(CategoryRef category) { this.category = category; }

    public PersonRef getAssignedPerson() { return assignedPerson; }
    public void setAssignedPerson(PersonRef assignedPerson) { this.assignedPerson = assignedPerson; }

    public String getSearchSnippet() { return searchSnippet; }
    public void setSearchSnippet(String searchSnippet) { this.searchSnippet = searchSnippet; }
}
