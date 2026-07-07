package com.ureport.open311.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;

@JacksonXmlRootElement(localName = "request")
public class Open311ServiceRequestDto {

    @JsonProperty("service_request_id")
    @JacksonXmlProperty(localName = "service_request_id")
    private String serviceRequestId;

    @JsonProperty("status")
    @JacksonXmlProperty(localName = "status")
    private String status;

    @JsonProperty("status_notes")
    @JacksonXmlProperty(localName = "status_notes")
    private String statusNotes;

    @JsonProperty("service_name")
    @JacksonXmlProperty(localName = "service_name")
    private String serviceName;

    @JsonProperty("service_code")
    @JacksonXmlProperty(localName = "service_code")
    private String serviceCode;

    @JsonProperty("description")
    @JacksonXmlProperty(localName = "description")
    private String description;

    @JsonProperty("agency_responsible")
    @JacksonXmlProperty(localName = "agency_responsible")
    private String agencyResponsible;

    @JsonProperty("service_notice")
    @JacksonXmlProperty(localName = "service_notice")
    private String serviceNotice;  // always ""

    @JsonProperty("requested_datetime")
    @JacksonXmlProperty(localName = "requested_datetime")
    private String requestedDatetime;  // ISO 8601

    @JsonProperty("updated_datetime")
    @JacksonXmlProperty(localName = "updated_datetime")
    private String updatedDatetime;  // ISO 8601

    @JsonProperty("expected_datetime")
    @JacksonXmlProperty(localName = "expected_datetime")
    private String expectedDatetime;  // ISO 8601 or null

    @JsonProperty("address")
    @JacksonXmlProperty(localName = "address")
    private String address;

    @JsonProperty("address_id")
    @JacksonXmlProperty(localName = "address_id")
    private String addressId;

    @JsonProperty("zipcode")
    @JacksonXmlProperty(localName = "zipcode")
    private String zipcode;

    @JsonProperty("lat")
    @JacksonXmlProperty(localName = "lat")
    private Double lat;

    // IMPORTANT: Java field is 'lon' but JSON/XML serialized name is "long" per GeoReport v2 spec
    @JsonProperty("long")
    @JacksonXmlProperty(localName = "long")
    private Double lon;

    @JsonProperty("media_url")
    @JacksonXmlProperty(localName = "media_url")
    private String mediaUrl;

    // Getters and setters
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

    public String getServiceNotice() { return serviceNotice; }
    public void setServiceNotice(String serviceNotice) { this.serviceNotice = serviceNotice; }

    public String getRequestedDatetime() { return requestedDatetime; }
    public void setRequestedDatetime(String requestedDatetime) { this.requestedDatetime = requestedDatetime; }

    public String getUpdatedDatetime() { return updatedDatetime; }
    public void setUpdatedDatetime(String updatedDatetime) { this.updatedDatetime = updatedDatetime; }

    public String getExpectedDatetime() { return expectedDatetime; }
    public void setExpectedDatetime(String expectedDatetime) { this.expectedDatetime = expectedDatetime; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getAddressId() { return addressId; }
    public void setAddressId(String addressId) { this.addressId = addressId; }

    public String getZipcode() { return zipcode; }
    public void setZipcode(String zipcode) { this.zipcode = zipcode; }

    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }

    public Double getLon() { return lon; }
    public void setLon(Double lon) { this.lon = lon; }

    public String getMediaUrl() { return mediaUrl; }
    public void setMediaUrl(String mediaUrl) { this.mediaUrl = mediaUrl; }
}
