package com.ureport.public_api.dto;

/**
 * POJO for multipart form fields accepted by POST /api/tickets/public.
 * All fields are optional except categoryId and description (validated in controller).
 */
public class PublicTicketRequest {

    private String firstname;
    private String lastname;
    private String email;
    private String phone;
    private Long categoryId;      // required — matches formData.categoryId in StepReview
    private String location;      // maps from FormData field "location" (formData.address)
    private Double lat;
    private Double lon;
    private String description;   // required, min 1 char

    public String getFirstname() { return firstname; }
    public void setFirstname(String firstname) { this.firstname = firstname; }

    public String getLastname() { return lastname; }
    public void setLastname(String lastname) { this.lastname = lastname; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }

    public Double getLon() { return lon; }
    public void setLon(Double lon) { this.lon = lon; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
