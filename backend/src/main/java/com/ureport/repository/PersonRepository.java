package com.ureport.repository;

import com.ureport.domain.Person;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PersonRepository extends JpaRepository<Person, Long> {

    Optional<Person> findByEmail(String email);

    Optional<Person> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByUsernameAndIdNot(String username, Long id);

    @Query("SELECT p FROM Person p WHERE " +
           "(:q IS NULL OR LOWER(p.firstname) LIKE LOWER(CONCAT('%',:q,'%')) " +
           " OR LOWER(p.lastname) LIKE LOWER(CONCAT('%',:q,'%')) " +
           " OR LOWER(p.email) LIKE LOWER(CONCAT('%',:q,'%')) " +
           " OR LOWER(p.username) LIKE LOWER(CONCAT('%',:q,'%'))) " +
           "AND (:role IS NULL OR p.role = :role)")
    Page<Person> searchPeople(@Param("q") String q, @Param("role") String role, Pageable pageable);
}
