package com.ureport.repository;

import com.ureport.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Integer> {

    List<Category> findByActiveTrue();

    List<Category> findByActiveTrueOrderByCategoryGroupOrderingAscNameAsc();

    List<Category> findByDepartment_Id(Integer departmentId);

    List<Category> findByCategoryGroup_Id(Integer groupId);
}
