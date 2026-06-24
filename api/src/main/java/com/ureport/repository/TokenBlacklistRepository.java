package com.ureport.repository;

import com.ureport.entity.TokenBlacklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;

@Repository
public interface TokenBlacklistRepository extends JpaRepository<TokenBlacklist, String> {
    void deleteByExpiresAtBefore(OffsetDateTime now);
}
