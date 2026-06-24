package com.ureport.repository;

import com.ureport.entity.TicketGeoData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketGeoDataRepository extends JpaRepository<TicketGeoData, Long> {
}
