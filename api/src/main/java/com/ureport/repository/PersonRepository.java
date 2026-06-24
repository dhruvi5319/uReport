package com.ureport.repository;

import com.ureport.entity.Person;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PersonRepository extends JpaRepository<Person, Integer> {

    Optional<Person> findByUsername(String username);

    Page<Person> findByDeletedAtIsNull(Pageable pageable);

    List<Person> findByDepartmentId(Integer departmentId);

    /**
     * Find a person by email address (joins to peopleEmails).
     * Used by findOrCreateFromOpen311 in PersonService.
     */
    @Query("SELECT DISTINCT p FROM Person p JOIN p.emails e " +
           "WHERE p.deletedAt IS NULL AND LOWER(e.email) = LOWER(:email)")
    Optional<Person> findByEmailsEmailIgnoreCase(@Param("email") String email);

    /**
     * Full-text ILIKE search across firstname, lastname, organization, email.
     */
    @Query("SELECT DISTINCT p FROM Person p LEFT JOIN p.emails e " +
           "WHERE p.deletedAt IS NULL AND " +
           "(:q IS NULL OR LOWER(p.firstname) LIKE LOWER(CONCAT('%',:q,'%')) " +
           "OR LOWER(p.lastname) LIKE LOWER(CONCAT('%',:q,'%')) " +
           "OR LOWER(p.organization) LIKE LOWER(CONCAT('%',:q,'%')) " +
           "OR LOWER(e.email) LIKE LOWER(CONCAT('%',:q,'%')))")
    Page<Person> searchPeople(@Param("q") String q, Pageable pageable);
}
