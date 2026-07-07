package com.ureport.domain;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;

/**
 * Junction entity for department_actions (many-to-many between departments and actions).
 * Tracks which actions are available for a department.
 */
@Entity
@Table(name = "department_actions")
@IdClass(DepartmentAction.DepartmentActionId.class)
public class DepartmentAction {

    @Id
    @Column(name = "department_id")
    private Long departmentId;

    @Id
    @Column(name = "action_id")
    private Long actionId;

    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public Long getActionId() { return actionId; }
    public void setActionId(Long actionId) { this.actionId = actionId; }

    /**
     * Composite primary key for DepartmentAction.
     */
    public static class DepartmentActionId implements Serializable {
        private Long departmentId;
        private Long actionId;

        public DepartmentActionId() {}
        public DepartmentActionId(Long departmentId, Long actionId) {
            this.departmentId = departmentId;
            this.actionId = actionId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof DepartmentActionId)) return false;
            DepartmentActionId that = (DepartmentActionId) o;
            return Objects.equals(departmentId, that.departmentId) &&
                   Objects.equals(actionId, that.actionId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(departmentId, actionId);
        }
    }
}
