package com.ureport.repository;

import com.ureport.domain.PeoplePhone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PeoplePhoneRepository extends JpaRepository<PeoplePhone, Long> {
    List<PeoplePhone> findByPersonId(Long personId);
    void deleteByPersonId(Long personId);
}
