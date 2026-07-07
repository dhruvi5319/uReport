package com.ureport.open311.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;

@JacksonXmlRootElement(localName = "service")
public class Open311ServiceDto {

    @JsonProperty("service_code")
    @JacksonXmlProperty(localName = "service_code")
    private String serviceCode;

    @JsonProperty("service_name")
    @JacksonXmlProperty(localName = "service_name")
    private String serviceName;

    @JsonProperty("description")
    @JacksonXmlProperty(localName = "description")
    private String description;

    @JsonProperty("metadata")
    @JacksonXmlProperty(localName = "metadata")
    private Boolean metadata;  // always false

    @JsonProperty("type")
    @JacksonXmlProperty(localName = "type")
    private String type;  // always "realtime"

    @JsonProperty("keywords")
    @JacksonXmlProperty(localName = "keywords")
    private String keywords;  // always ""

    @JsonProperty("group")
    @JacksonXmlProperty(localName = "group")
    private String group;

    // Default constructor
    public Open311ServiceDto() {}

    // All-args constructor
    public Open311ServiceDto(String serviceCode, String serviceName, String description,
                              Boolean metadata, String type, String keywords, String group) {
        this.serviceCode = serviceCode;
        this.serviceName = serviceName;
        this.description = description;
        this.metadata = metadata;
        this.type = type;
        this.keywords = keywords;
        this.group = group;
    }

    public String getServiceCode() { return serviceCode; }
    public void setServiceCode(String serviceCode) { this.serviceCode = serviceCode; }

    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Boolean getMetadata() { return metadata; }
    public void setMetadata(Boolean metadata) { this.metadata = metadata; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getKeywords() { return keywords; }
    public void setKeywords(String keywords) { this.keywords = keywords; }

    public String getGroup() { return group; }
    public void setGroup(String group) { this.group = group; }
}
