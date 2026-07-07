package com.ureport.repository;

import com.ureport.domain.Action;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ActionsRepository extends JpaRepository<Action, Long> {
    Optional<Action> findByName(String name);
}
