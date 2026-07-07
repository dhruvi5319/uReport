package com.ureport.repository;

import com.ureport.domain.Person;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PersonRepository extends JpaRepository<Person, Long> {
    Optional<Person> findByUsername(String username);

    /**
     * Find person by email via join with people_emails table.
     * Used by Open311 POST /requests to look up existing reporters.
     */
    @Query("SELECT p FROM Person p JOIN PeopleEmail pe ON pe.personId = p.id WHERE pe.email = :email")
    Optional<Person> findByEmail(@Param("email") String email);
}
