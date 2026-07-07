package com.ureport.repository;

import com.ureport.domain.Media;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MediaRepository extends JpaRepository<Media, Long> {
    List<Media> findByTicketIdOrderByUploadedAsc(Long ticketId);
    long countByTicketId(Long ticketId);
}
