package com.ureport.repository;

import com.ureport.domain.PeopleEmail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PeopleEmailRepository extends JpaRepository<PeopleEmail, Long> {
    List<PeopleEmail> findByPersonIdAndUsedForNotificationsTrue(Long personId);
    List<PeopleEmail> findByPersonId(Long personId);
}
