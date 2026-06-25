package com.ureport.repository;

import com.ureport.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LocationRepository extends JpaRepository<Location, Integer> {

    Optional<Location> findByAddressAndCityAndStateAndZip(
            String address, String city, String state, String zip);

    @Query("SELECT l FROM Location l WHERE (:q IS NULL OR LOWER(l.address) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<Location> searchByAddress(@Param("q") String q);
}
