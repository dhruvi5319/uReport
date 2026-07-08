package com.ureport.repository;

import com.ureport.domain.PeopleAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PeopleAddressRepository extends JpaRepository<PeopleAddress, Long> {
    List<PeopleAddress> findByPersonId(Long personId);
    void deleteByPersonId(Long personId);
}
