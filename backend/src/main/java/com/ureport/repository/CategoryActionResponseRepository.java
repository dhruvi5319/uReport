package com.ureport.repository;

import com.ureport.domain.CategoryActionResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryActionResponseRepository extends JpaRepository<CategoryActionResponse, Long> {

    Optional<CategoryActionResponse> findByCategoryIdAndActionId(Long categoryId, Long actionId);

    List<CategoryActionResponse> findByCategoryId(Long categoryId);

    void deleteByCategoryId(Long categoryId);
}
