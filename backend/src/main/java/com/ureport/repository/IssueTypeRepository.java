package com.ureport.repository;

import com.ureport.domain.IssueType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IssueTypeRepository extends JpaRepository<IssueType, Long> {

    List<IssueType> findAllByOrderByNameAsc();
}
