package com.ureport.repository;

import com.ureport.domain.DepartmentAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface DepartmentActionRepository extends JpaRepository<DepartmentAction, DepartmentAction.DepartmentActionId> {

    boolean existsByDepartmentIdAndActionId(Long departmentId, Long actionId);

    List<DepartmentAction> findByDepartmentId(Long departmentId);

    @Modifying
    @Transactional
    void deleteByDepartmentId(Long departmentId);
}
