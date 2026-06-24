package com.ureport.dto.request;

import java.math.BigDecimal;

/**
 * Query parameters for ticket search, filter, and pagination.
 * Used by TicketSearchService for FTS, multi-field filter, pagination, and map view.
 */
public class TicketSearchParams {

    private String q;                       // FTS keyword query (websearch_to_tsquery)
    private Integer categoryId;
    private Integer departmentId;           // JOIN categories.department_id = ?
    private Integer assignedPersonId;
    private Integer enteredByPersonId;
    private Integer reportedByPersonId;
    private String status;                  // 'open' or 'closed'
    private Integer substatusId;
    private Integer contactMethodId;
    private Integer clientId;
    private Integer issueTypeId;
    private String enteredDateFrom;         // ISO date string
    private String enteredDateTo;
    private String closedDateFrom;
    private String closedDateTo;
    private String city;
    private String zip;
    private BigDecimal lat;
    private BigDecimal lon;
    private Integer radius;                 // meters — for ST_DWithin
    private int page = 1;
    private int limit = 25;
    private String sortBy = "enteredDate";
    private String sortDir = "desc";

    public String getQ() { return q; }
    public void setQ(String q) { this.q = q; }

    public Integer getCategoryId() { return categoryId; }
    public void setCategoryId(Integer categoryId) { this.categoryId = categoryId; }

    public Integer getDepartmentId() { return departmentId; }
    public void setDepartmentId(Integer departmentId) { this.departmentId = departmentId; }

    public Integer getAssignedPersonId() { return assignedPersonId; }
    public void setAssignedPersonId(Integer assignedPersonId) { this.assignedPersonId = assignedPersonId; }

    public Integer getEnteredByPersonId() { return enteredByPersonId; }
    public void setEnteredByPersonId(Integer enteredByPersonId) { this.enteredByPersonId = enteredByPersonId; }

    public Integer getReportedByPersonId() { return reportedByPersonId; }
    public void setReportedByPersonId(Integer reportedByPersonId) { this.reportedByPersonId = reportedByPersonId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getSubstatusId() { return substatusId; }
    public void setSubstatusId(Integer substatusId) { this.substatusId = substatusId; }

    public Integer getContactMethodId() { return contactMethodId; }
    public void setContactMethodId(Integer contactMethodId) { this.contactMethodId = contactMethodId; }

    public Integer getClientId() { return clientId; }
    public void setClientId(Integer clientId) { this.clientId = clientId; }

    public Integer getIssueTypeId() { return issueTypeId; }
    public void setIssueTypeId(Integer issueTypeId) { this.issueTypeId = issueTypeId; }

    public String getEnteredDateFrom() { return enteredDateFrom; }
    public void setEnteredDateFrom(String enteredDateFrom) { this.enteredDateFrom = enteredDateFrom; }

    public String getEnteredDateTo() { return enteredDateTo; }
    public void setEnteredDateTo(String enteredDateTo) { this.enteredDateTo = enteredDateTo; }

    public String getClosedDateFrom() { return closedDateFrom; }
    public void setClosedDateFrom(String closedDateFrom) { this.closedDateFrom = closedDateFrom; }

    public String getClosedDateTo() { return closedDateTo; }
    public void setClosedDateTo(String closedDateTo) { this.closedDateTo = closedDateTo; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getZip() { return zip; }
    public void setZip(String zip) { this.zip = zip; }

    public BigDecimal getLat() { return lat; }
    public void setLat(BigDecimal lat) { this.lat = lat; }

    public BigDecimal getLon() { return lon; }
    public void setLon(BigDecimal lon) { this.lon = lon; }

    public Integer getRadius() { return radius; }
    public void setRadius(Integer radius) { this.radius = radius; }

    public int getPage() { return page; }
    public void setPage(int page) { this.page = Math.max(1, page); }

    public int getLimit() { return limit; }
    public void setLimit(int limit) { this.limit = Math.min(Math.max(1, limit), 500); }

    public String getSortBy() { return sortBy; }
    public void setSortBy(String sortBy) { this.sortBy = sortBy; }

    public String getSortDir() { return sortDir; }
    public void setSortDir(String sortDir) { this.sortDir = sortDir; }
}
