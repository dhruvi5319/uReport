package com.ureport.repository;

import com.ureport.domain.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {

    /** Returns all departments ordered alphabetically by name. */
    List<Department> findAllByOrderByNameAsc();
}
