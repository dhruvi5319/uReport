package com.ureport.infrastructure;

import io.zonky.test.db.AutoConfigureEmbeddedDatabase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies Spring Boot starts cleanly with embedded PostgreSQL (no Docker daemon).
 * Checks: actuator health UP, Flyway ran V1+V2 migrations, HikariCP connected.
 *
 * Uses io.zonky.test:embedded-postgres — starts an in-process PostgreSQL 16
 * binary. Works in Kubernetes sandboxes that have no Docker socket.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@AutoConfigureEmbeddedDatabase(
    provider = AutoConfigureEmbeddedDatabase.DatabaseProvider.ZONKY,
    type = AutoConfigureEmbeddedDatabase.DatabaseType.POSTGRES
)
class ApplicationStartIT {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void actuatorHealthReturnsUp() {
        ResponseEntity<Map> response = restTemplate
            .getForEntity("http://localhost:" + port + "/actuator/health", Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("status")).isEqualTo("UP");
    }

    @Test
    void flywayRanBothMigrations() {
        List<Map<String, Object>> history = jdbc.queryForList(
            "SELECT version, description, success " +
            "FROM flyway_schema_history " +
            "ORDER BY installed_rank"
        );

        assertThat(history).hasSizeGreaterThanOrEqualTo(2);

        // V1 — initial schema
        Map<String, Object> v1 = history.get(0);
        assertThat(v1.get("version")).isEqualTo("1");
        assertThat(v1.get("success")).isEqualTo(true);

        // V2 — search_vector
        Map<String, Object> v2 = history.get(1);
        assertThat(v2.get("version")).isEqualTo("2");
        assertThat(v2.get("success")).isEqualTo(true);
    }

    @Test
    void allEighteenTablesExistAfterMigration() {
        List<String> tables = jdbc.queryForList(
            "SELECT table_name FROM information_schema.tables " +
            "WHERE table_schema = 'public' AND table_type = 'BASE TABLE' " +
            "ORDER BY table_name",
            String.class
        );
        // All 18 domain tables plus flyway_schema_history
        assertThat(tables).contains(
            "tickets", "ticket_history", "people", "departments",
            "categories", "category_groups", "actions", "substatus",
            "issue_types", "contact_methods", "clients", "media",
            "bookmarks", "geoclusters", "ticket_geodata",
            "people_emails", "people_phones", "people_addresses"
        );
    }

    @Test
    void searchVectorColumnExistsOnTickets() {
        List<Map<String, Object>> cols = jdbc.queryForList(
            "SELECT column_name, data_type FROM information_schema.columns " +
            "WHERE table_name = 'tickets' AND column_name = 'search_vector'"
        );
        assertThat(cols).hasSize(1);
        assertThat(cols.get(0).get("data_type")).isEqualTo("tsvector");
    }
}
