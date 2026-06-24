package com.ureport.repository;

import com.ureport.entity.CategoryGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryGroupRepository extends JpaRepository<CategoryGroup, Integer> {

    List<CategoryGroup> findAllByOrderByOrderingAsc();
}
