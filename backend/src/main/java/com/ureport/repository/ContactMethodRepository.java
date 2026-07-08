package com.ureport.repository;

import com.ureport.domain.ContactMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContactMethodRepository extends JpaRepository<ContactMethod, Long> {

    List<ContactMethod> findAllByOrderByNameAsc();
}
