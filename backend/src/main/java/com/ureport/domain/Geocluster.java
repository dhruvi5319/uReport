package com.ureport.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "geoclusters")
public class Geocluster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "level", nullable = false)
    private Integer level;

    // PostgreSQL POINT stored as "(lon,lat)" string — parse at service layer
    // Map as String to avoid custom type converter complexity
    @Column(name = "center", columnDefinition = "point")
    private String center; // format: "(x,y)" where x=longitude, y=latitude

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Integer getLevel() { return level; }
    public void setLevel(Integer level) { this.level = level; }
    public String getCenter() { return center; }
    public void setCenter(String center) { this.center = center; }
}
