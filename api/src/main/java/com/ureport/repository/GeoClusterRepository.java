package com.ureport.repository;

import com.ureport.entity.GeoCluster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface GeoClusterRepository extends JpaRepository<GeoCluster, Long> {

    @Modifying
    @Transactional
    @Query("DELETE FROM GeoCluster g WHERE g.level = :level")
    void deleteByLevel(@Param("level") Short level);
}
