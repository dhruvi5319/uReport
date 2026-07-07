package com.ureport.repository;

import com.ureport.domain.DepartmentAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DepartmentActionRepository extends JpaRepository<DepartmentAction, DepartmentAction.DepartmentActionId> {
    boolean existsByDepartmentIdAndActionId(Long departmentId, Long actionId);
}
