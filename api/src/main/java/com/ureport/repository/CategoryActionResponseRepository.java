package com.ureport.repository;

import com.ureport.entity.CategoryActionResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryActionResponseRepository extends JpaRepository<CategoryActionResponse, Integer> {

    List<CategoryActionResponse> findByCategoryId(Integer categoryId);

    Optional<CategoryActionResponse> findByCategoryIdAndActionId(Integer categoryId, Integer actionId);
}
