package com.ureport.repository;

import com.ureport.domain.Geocluster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Native query methods per zoom level — one method per zoom level (0-6).
 * CRITICAL: Column names are NEVER dynamically interpolated into SQL.
 * The service uses a Java switch to dispatch to the correct method.
 */
public interface GeoclusterRepository extends JpaRepository<Geocluster, Long> {

    @Query(value = """
        SELECT tg.cluster_id_0 as cluster_id, COUNT(*) as count,
               g.level,
               CAST(split_part(trim(both '()' from CAST(g.center AS text)), ',', 1) AS double precision) as lon,
               CAST(split_part(trim(both '()' from CAST(g.center AS text)), ',', 2) AS double precision) as lat
        FROM ticket_geodata tg
        JOIN geoclusters g ON g.id = tg.cluster_id_0
        JOIN tickets t ON t.id = tg.ticket_id
        WHERE (:status IS NULL OR t.status = :status)
        GROUP BY tg.cluster_id_0, g.center, g.level
        """, nativeQuery = true)
    List<Object[]> findClusters0(@Param("status") String status);

    @Query(value = """
        SELECT tg.cluster_id_1 as cluster_id, COUNT(*) as count, g.level,
               CAST(split_part(trim(both '()' from CAST(g.center AS text)), ',', 1) AS double precision) as lon,
               CAST(split_part(trim(both '()' from CAST(g.center AS text)), ',', 2) AS double precision) as lat
        FROM ticket_geodata tg JOIN geoclusters g ON g.id = tg.cluster_id_1
        JOIN tickets t ON t.id = tg.ticket_id
        WHERE (:status IS NULL OR t.status = :status)
        GROUP BY tg.cluster_id_1, g.center, g.level
        """, nativeQuery = true)
    List<Object[]> findClusters1(@Param("status") String status);

    @Query(value = """
        SELECT tg.cluster_id_2 as cluster_id, COUNT(*) as count, g.level,
               CAST(split_part(trim(both '()' from CAST(g.center AS text)), ',', 1) AS double precision) as lon,
               CAST(split_part(trim(both '()' from CAST(g.center AS text)), ',', 2) AS double precision) as lat
        FROM ticket_geodata tg JOIN geoclusters g ON g.id = tg.cluster_id_2
        JOIN tickets t ON t.id = tg.ticket_id
        WHERE (:status IS NULL OR t.status = :status)
        GROUP BY tg.cluster_id_2, g.center, g.level
        """, nativeQuery = true)
    List<Object[]> findClusters2(@Param("status") String status);

    @Query(value = """
        SELECT tg.cluster_id_3 as cluster_id, COUNT(*) as count, g.level,
               CAST(split_part(trim(both '()' from CAST(g.center AS text)), ',', 1) AS double precision) as lon,
               CAST(split_part(trim(both '()' from CAST(g.center AS text)), ',', 2) AS double precision) as lat
        FROM ticket_geodata tg JOIN geoclusters g ON g.id = tg.cluster_id_3
        JOIN tickets t ON t.id = tg.ticket_id
        WHERE (:status IS NULL OR t.status = :status)
        GROUP BY tg.cluster_id_3, g.center, g.level
        """, nativeQuery = true)
    List<Object[]> findClusters3(@Param("status") String status);

    @Query(value = """
        SELECT tg.cluster_id_4 as cluster_id, COUNT(*) as count, g.level,
               CAST(split_part(trim(both '()' from CAST(g.center AS text)), ',', 1) AS double precision) as lon,
               CAST(split_part(trim(both '()' from CAST(g.center AS text)), ',', 2) AS double precision) as lat
        FROM ticket_geodata tg JOIN geoclusters g ON g.id = tg.cluster_id_4
        JOIN tickets t ON t.id = tg.ticket_id
        WHERE (:status IS NULL OR t.status = :status)
        GROUP BY tg.cluster_id_4, g.center, g.level
        """, nativeQuery = true)
    List<Object[]> findClusters4(@Param("status") String status);

    @Query(value = """
        SELECT tg.cluster_id_5 as cluster_id, COUNT(*) as count, g.level,
               CAST(split_part(trim(both '()' from CAST(g.center AS text)), ',', 1) AS double precision) as lon,
               CAST(split_part(trim(both '()' from CAST(g.center AS text)), ',', 2) AS double precision) as lat
        FROM ticket_geodata tg JOIN geoclusters g ON g.id = tg.cluster_id_5
        JOIN tickets t ON t.id = tg.ticket_id
        WHERE (:status IS NULL OR t.status = :status)
        GROUP BY tg.cluster_id_5, g.center, g.level
        """, nativeQuery = true)
    List<Object[]> findClusters5(@Param("status") String status);

    @Query(value = """
        SELECT tg.cluster_id_6 as cluster_id, COUNT(*) as count, g.level,
               CAST(split_part(trim(both '()' from CAST(g.center AS text)), ',', 1) AS double precision) as lon,
               CAST(split_part(trim(both '()' from CAST(g.center AS text)), ',', 2) AS double precision) as lat
        FROM ticket_geodata tg JOIN geoclusters g ON g.id = tg.cluster_id_6
        JOIN tickets t ON t.id = tg.ticket_id
        WHERE (:status IS NULL OR t.status = :status)
        GROUP BY tg.cluster_id_6, g.center, g.level
        """, nativeQuery = true)
    List<Object[]> findClusters6(@Param("status") String status);
}
