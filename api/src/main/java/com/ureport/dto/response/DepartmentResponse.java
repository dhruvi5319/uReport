package com.ureport.dto.response;

public class DepartmentResponse {

    private Integer id;
    private String name;
    private Integer defaultPerson_id;
    private String defaultPersonName;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getDefaultPerson_id() { return defaultPerson_id; }
    public void setDefaultPerson_id(Integer defaultPerson_id) { this.defaultPerson_id = defaultPerson_id; }

    public String getDefaultPersonName() { return defaultPersonName; }
    public void setDefaultPersonName(String defaultPersonName) { this.defaultPersonName = defaultPersonName; }
}
