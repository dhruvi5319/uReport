package com.ureport.repository;

import com.ureport.domain.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByActiveTrue();

    /** Used by DepartmentService to check for categories referencing this department (delete safety). */
    boolean existsByDepartmentId(Long departmentId);

    /** Used by DepartmentService to list categories belonging to a department. */
    List<Category> findByDepartmentId(Long departmentId);

    /** Returns the count of categories referencing the given department. */
    @Query("SELECT COUNT(c) FROM Category c WHERE c.department.id = :id")
    long countByDepartmentId(@Param("id") Long id);
}
