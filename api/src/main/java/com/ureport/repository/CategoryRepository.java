package com.ureport.repository;

import com.ureport.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Integer> {

    List<Category> findByActiveTrue();

    List<Category> findByActiveTrueOrderByCategoryGroupOrderingAscNameAsc();

    List<Category> findByDepartmentId(Integer departmentId);

    List<Category> findByCategoryGroupId(Integer groupId);
}
