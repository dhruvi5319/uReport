package com.ureport.repository;

import com.ureport.entity.Substatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubstatusRepository extends JpaRepository<Substatus, Integer> {

    Optional<Substatus> findByStatusAndIsDefaultTrue(String status);

    /** Backward-compatible alias — TicketService uses this method name */
    default Optional<Substatus> findFirstByStatusAndIsDefaultTrue(String status) {
        return findByStatusAndIsDefaultTrue(status);
    }

    List<Substatus> findByStatus(String status);
}
