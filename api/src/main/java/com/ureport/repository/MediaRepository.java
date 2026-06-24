package com.ureport.repository;

import com.ureport.entity.Media;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MediaRepository extends JpaRepository<Media, Long> {
    List<Media> findByTicketId(Long ticketId);
    Optional<Media> findByInternalFilename(String internalFilename);
}
