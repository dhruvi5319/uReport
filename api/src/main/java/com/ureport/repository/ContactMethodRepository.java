package com.ureport.repository;

import com.ureport.entity.ContactMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ContactMethodRepository extends JpaRepository<ContactMethod, Integer> {
}
