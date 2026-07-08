package com.ureport.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "ticket_geodata")
public class TicketGeodata {

    @Id
    @Column(name = "ticket_id")
    private Long ticketId;

    @Column(name = "cluster_id_0") private Long clusterId0;
    @Column(name = "cluster_id_1") private Long clusterId1;
    @Column(name = "cluster_id_2") private Long clusterId2;
    @Column(name = "cluster_id_3") private Long clusterId3;
    @Column(name = "cluster_id_4") private Long clusterId4;
    @Column(name = "cluster_id_5") private Long clusterId5;
    @Column(name = "cluster_id_6") private Long clusterId6;

    public Long getTicketId() { return ticketId; }
    public void setTicketId(Long ticketId) { this.ticketId = ticketId; }
    public Long getClusterId0() { return clusterId0; }
    public void setClusterId0(Long clusterId0) { this.clusterId0 = clusterId0; }
    public Long getClusterId1() { return clusterId1; }
    public void setClusterId1(Long clusterId1) { this.clusterId1 = clusterId1; }
    public Long getClusterId2() { return clusterId2; }
    public void setClusterId2(Long clusterId2) { this.clusterId2 = clusterId2; }
    public Long getClusterId3() { return clusterId3; }
    public void setClusterId3(Long clusterId3) { this.clusterId3 = clusterId3; }
    public Long getClusterId4() { return clusterId4; }
    public void setClusterId4(Long clusterId4) { this.clusterId4 = clusterId4; }
    public Long getClusterId5() { return clusterId5; }
    public void setClusterId5(Long clusterId5) { this.clusterId5 = clusterId5; }
    public Long getClusterId6() { return clusterId6; }
    public void setClusterId6(Long clusterId6) { this.clusterId6 = clusterId6; }
}
