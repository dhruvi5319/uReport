package com.ureport.repository;

import com.ureport.domain.Substatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubstatusRepository extends JpaRepository<Substatus, Long> {

    List<Substatus> findByStatusAndIsDefaultTrue(String status);

    List<Substatus> findAllByOrderByStatusAscNameAsc();
}
