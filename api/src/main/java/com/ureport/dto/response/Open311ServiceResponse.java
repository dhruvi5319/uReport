package com.ureport.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public class Open311ServiceResponse {

    @JsonProperty("service_code")
    private String serviceCode;

    @JsonProperty("service_name")
    private String serviceName;

    private String description;

    private String metadata;    // "true" or "false" — string, not boolean

    private String type;        // always "realtime"

    private String keywords;

    private String group;       // nullable

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private List<Open311ServiceAttributeResponse> attributes;

    public String getServiceCode() { return serviceCode; }
    public void setServiceCode(String serviceCode) { this.serviceCode = serviceCode; }

    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getKeywords() { return keywords; }
    public void setKeywords(String keywords) { this.keywords = keywords; }

    public String getGroup() { return group; }
    public void setGroup(String group) { this.group = group; }

    public List<Open311ServiceAttributeResponse> getAttributes() { return attributes; }
    public void setAttributes(List<Open311ServiceAttributeResponse> attributes) { this.attributes = attributes; }
}
