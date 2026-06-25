package com.ureport.repository;

import com.ureport.entity.PeopleEmail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for peopleEmails table.
 * Supports email lookup (for ticket creation) and notification email queries.
 */
@Repository
public interface PeopleEmailRepository extends JpaRepository<PeopleEmail, Integer> {
    Optional<PeopleEmail> findFirstByEmail(String email);

    @Query("SELECT pe FROM PeopleEmail pe WHERE pe.person.id = :personId AND pe.usedForNotifications = true")
    List<PeopleEmail> findByPersonIdAndUsedForNotificationsTrue(@Param("personId") Integer personId);
}
