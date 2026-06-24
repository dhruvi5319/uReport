package com.ureport.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Stub repository for peopleEmails table.
 * Wave 2c (People Management) will flesh this out with full email management.
 * This stub exists so TicketService can look up reporter by email at ticket creation.
 */
@Repository
public interface PeopleEmailRepository extends JpaRepository<com.ureport.entity.PeopleEmail, Integer> {
    Optional<com.ureport.entity.PeopleEmail> findFirstByEmail(String email);
}
