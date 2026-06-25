package com.ureport.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;
import java.util.Map;

public class Open311ServiceAttributeResponse {

    private boolean variable;
    private String code;
    private String datatype;
    private boolean required;
    private String description;
    private int order;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private List<Map<String, String>> values;

    public boolean isVariable() { return variable; }
    public void setVariable(boolean variable) { this.variable = variable; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getDatatype() { return datatype; }
    public void setDatatype(String datatype) { this.datatype = datatype; }

    public boolean isRequired() { return required; }
    public void setRequired(boolean required) { this.required = required; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getOrder() { return order; }
    public void setOrder(int order) { this.order = order; }

    public List<Map<String, String>> getValues() { return values; }
    public void setValues(List<Map<String, String>> values) { this.values = values; }
}
