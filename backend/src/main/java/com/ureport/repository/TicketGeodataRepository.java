package com.ureport.repository;

import com.ureport.domain.TicketGeodata;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketGeodataRepository extends JpaRepository<TicketGeodata, Long> {
}
