package com.ureport.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "geoclusters")
public class GeoCluster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "level", nullable = false)
    private Short level;

    // center is a PostGIS GEOGRAPHY(POINT, 4326) column — populated via native query
    // Not mapped as JPA field to avoid Hibernate Spatial dependency;
    // GeoClusterScheduler inserts rows via native SQL with ST_MakePoint

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Short getLevel() { return level; }
    public void setLevel(Short level) { this.level = level; }
}
