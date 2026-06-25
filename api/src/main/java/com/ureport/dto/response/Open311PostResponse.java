package com.ureport.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Open311PostResponse {

    @JsonProperty("service_request_id")
    private String serviceRequestId;

    @JsonProperty("service_notice")
    private String serviceNotice = "";   // "" by default

    @JsonProperty("account_id")
    private String accountId = "";       // "" by default

    public Open311PostResponse() {}

    public Open311PostResponse(String serviceRequestId) {
        this.serviceRequestId = serviceRequestId;
        this.serviceNotice = "";
        this.accountId = "";
    }

    public String getServiceRequestId() { return serviceRequestId; }
    public void setServiceRequestId(String serviceRequestId) { this.serviceRequestId = serviceRequestId; }

    public String getServiceNotice() { return serviceNotice; }
    public void setServiceNotice(String serviceNotice) { this.serviceNotice = serviceNotice; }

    public String getAccountId() { return accountId; }
    public void setAccountId(String accountId) { this.accountId = accountId; }
}
