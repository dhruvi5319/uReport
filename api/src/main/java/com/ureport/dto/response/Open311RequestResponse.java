package com.ureport.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Open311RequestResponse {

    @JsonProperty("service_request_id")
    private String serviceRequestId;

    private String status;

    @JsonProperty("status_notes")
    private String statusNotes;

    @JsonProperty("service_name")
    private String serviceName;

    @JsonProperty("service_code")
    private String serviceCode;

    private String description;

    @JsonProperty("agency_responsible")
    private String agencyResponsible;

    @JsonProperty("requested_datetime")
    private String requestedDatetime;

    @JsonProperty("updated_datetime")
    private String updatedDatetime;

    @JsonProperty("expected_datetime")
    private String expectedDatetime;

    private String lat;

    @JsonProperty("long")
    private String lng;  // Java field != JSON field name

    private String address;

    @JsonProperty("address_id")
    private String addressId;

    private String zipcode;

    @JsonProperty("media_url")
    private String mediaUrl;

    public String getServiceRequestId() { return serviceRequestId; }
    public void setServiceRequestId(String serviceRequestId) { this.serviceRequestId = serviceRequestId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getStatusNotes() { return statusNotes; }
    public void setStatusNotes(String statusNotes) { this.statusNotes = statusNotes; }

    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }

    public String getServiceCode() { return serviceCode; }
    public void setServiceCode(String serviceCode) { this.serviceCode = serviceCode; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAgencyResponsible() { return agencyResponsible; }
    public void setAgencyResponsible(String agencyResponsible) { this.agencyResponsible = agencyResponsible; }

    public String getRequestedDatetime() { return requestedDatetime; }
    public void setRequestedDatetime(String requestedDatetime) { this.requestedDatetime = requestedDatetime; }

    public String getUpdatedDatetime() { return updatedDatetime; }
    public void setUpdatedDatetime(String updatedDatetime) { this.updatedDatetime = updatedDatetime; }

    public String getExpectedDatetime() { return expectedDatetime; }
    public void setExpectedDatetime(String expectedDatetime) { this.expectedDatetime = expectedDatetime; }

    public String getLat() { return lat; }
    public void setLat(String lat) { this.lat = lat; }

    public String getLng() { return lng; }
    public void setLng(String lng) { this.lng = lng; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getAddressId() { return addressId; }
    public void setAddressId(String addressId) { this.addressId = addressId; }

    public String getZipcode() { return zipcode; }
    public void setZipcode(String zipcode) { this.zipcode = zipcode; }

    public String getMediaUrl() { return mediaUrl; }
    public void setMediaUrl(String mediaUrl) { this.mediaUrl = mediaUrl; }
}
