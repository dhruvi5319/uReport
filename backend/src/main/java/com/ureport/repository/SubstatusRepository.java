package com.ureport.repository;

import com.ureport.domain.Substatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubstatusRepository extends JpaRepository<Substatus, Long> {
}
