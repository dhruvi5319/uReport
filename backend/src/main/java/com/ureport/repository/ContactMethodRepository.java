package com.ureport.repository;

import com.ureport.domain.ContactMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ContactMethodRepository extends JpaRepository<ContactMethod, Long> {
}
