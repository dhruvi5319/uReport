package com.ureport.scheduler;

import com.ureport.entity.GeoCluster;
import com.ureport.entity.TicketGeoData;
import com.ureport.repository.GeoClusterRepository;
import com.ureport.repository.TicketGeoDataRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class GeoClusterScheduler {

    private static final Logger log = LoggerFactory.getLogger(GeoClusterScheduler.class);

    private final GeoClusterRepository geoClusterRepository;
    private final TicketGeoDataRepository ticketGeoDataRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    public GeoClusterScheduler(GeoClusterRepository geoClusterRepository,
                                TicketGeoDataRepository ticketGeoDataRepository) {
        this.geoClusterRepository = geoClusterRepository;
        this.ticketGeoDataRepository = ticketGeoDataRepository;
    }

    /**
     * Nightly at 2 AM: rebuild geoclusters and ticket_geodata tables.
     * Uses grid-based spatial grouping at 7 zoom levels (0-6).
     */
    @Scheduled(cron = "${app.scheduler.geo-cluster.cron:0 0 2 * * ?}")
    @Transactional
    public void rebuildGeoClusters() {
        long startEpoch = System.currentTimeMillis();
        log.info("[SCHEDULER] GeoClusterScheduler starting at {}", Instant.now());

        // Query geo-tagged tickets
        @SuppressWarnings("unchecked")
        List<Object[]> geoTickets = entityManager.createNativeQuery(
                "SELECT id, latitude, longitude FROM tickets WHERE latitude IS NOT NULL AND longitude IS NOT NULL")
                .getResultList();

        if (geoTickets.isEmpty()) {
            log.info("[SCHEDULER] GeoClusterScheduler: no geo-tagged tickets found, skipping");
            return;
        }

        int totalClusters = 0;

        // Process each zoom level 0-6
        for (int level = 0; level <= 6; level++) {
            short zoomLevel = (short) level;

            // Clear existing clusters for this level (CASCADE deletes ticket_geodata via FK ON DELETE SET NULL)
            geoClusterRepository.deleteByLevel(zoomLevel);

            // Grid cell size: 1 degree at level 0, halved each level
            double cellSize = 1.0 / Math.pow(2, level);

            // Group tickets into grid cells
            Map<String, List<long[]>> cellBuckets = new HashMap<>();
            for (Object[] row : geoTickets) {
                long ticketId = ((Number) row[0]).longValue();
                double lat = ((Number) row[1]).doubleValue();
                double lon = ((Number) row[2]).doubleValue();

                // Compute grid cell key
                int cellLat = (int) Math.floor(lat / cellSize);
                int cellLon = (int) Math.floor(lon / cellSize);
                String cellKey = cellLat + ":" + cellLon;

                cellBuckets.computeIfAbsent(cellKey, k -> new ArrayList<>())
                        .add(new long[]{ticketId, Double.doubleToLongBits(lat), Double.doubleToLongBits(lon)});
            }

            // For each cell, compute centroid and insert cluster
            for (Map.Entry<String, List<long[]>> entry : cellBuckets.entrySet()) {
                List<long[]> ticketsInCell = entry.getValue();

                double avgLat = 0.0, avgLon = 0.0;
                for (long[] t : ticketsInCell) {
                    avgLat += Double.longBitsToDouble(t[1]);
                    avgLon += Double.longBitsToDouble(t[2]);
                }
                avgLat /= ticketsInCell.size();
                avgLon /= ticketsInCell.size();

                // Insert geoclusters row with level + center as PostGIS geography
                Object clusterIdObj = entityManager.createNativeQuery(
                        "INSERT INTO geoclusters (level, center) VALUES (:level, ST_MakePoint(:lon, :lat)::geography) RETURNING id")
                        .setParameter("level", zoomLevel)
                        .setParameter("lon", avgLon)
                        .setParameter("lat", avgLat)
                        .getSingleResult();

                long clusterId = ((Number) clusterIdObj).longValue();
                totalClusters++;

                // Upsert ticket_geodata for each ticket in this cell
                for (long[] t : ticketsInCell) {
                    long ticketId = t[0];
                    String col = "cluster_id_" + level;
                    entityManager.createNativeQuery(
                            "INSERT INTO ticket_geodata (ticket_id, " + col + ") VALUES (:tid, :cid) " +
                            "ON CONFLICT (ticket_id) DO UPDATE SET " + col + " = EXCLUDED." + col)
                            .setParameter("tid", ticketId)
                            .setParameter("cid", clusterId)
                            .executeUpdate();
                }
            }
        }

        long duration = System.currentTimeMillis() - startEpoch;
        log.info("[SCHEDULER] GeoClusterScheduler completed in {}ms; {} clusters at 7 levels",
                duration, totalClusters);
    }
}
