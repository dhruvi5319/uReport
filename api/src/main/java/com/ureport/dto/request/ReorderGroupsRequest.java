package com.ureport.dto.request;

import java.util.List;

public class ReorderGroupsRequest {

    private List<GroupOrder> groups;

    public List<GroupOrder> getGroups() { return groups; }
    public void setGroups(List<GroupOrder> groups) { this.groups = groups; }

    public static class GroupOrder {
        private Integer id;
        private Integer ordering;

        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }

        public Integer getOrdering() { return ordering; }
        public void setOrdering(Integer ordering) { this.ordering = ordering; }
    }
}
