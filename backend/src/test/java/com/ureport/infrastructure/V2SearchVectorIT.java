package com.ureport.infrastructure;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test: verifies that Flyway V2__search_vector.sql
 * correctly adds the search_vector column, GIN index, trigger function,
 * and trigger on the tickets table. Confirms the trigger fires on INSERT.
 */
@SpringBootTest
@ActiveProfiles("test")
class V2SearchVectorIT {

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void searchVectorColumnExistsWithTsvectorType() {
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT column_name, data_type " +
            "FROM information_schema.columns " +
            "WHERE table_schema = 'public' " +
            "  AND table_name = 'tickets' " +
            "  AND column_name = 'search_vector'"
        );
        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).get("data_type")).isEqualTo("tsvector");
    }

    @Test
    void ginIndexExistsOnSearchVector() {
        List<String> indexes = jdbc.queryForList(
            "SELECT indexname FROM pg_indexes " +
            "WHERE tablename = 'tickets' " +
            "  AND indexname = 'idx_tickets_search_vector'",
            String.class
        );
        assertThat(indexes).containsExactly("idx_tickets_search_vector");
    }

    @Test
    void ginIndexUsesGinMethod() {
        List<String> indexDefs = jdbc.queryForList(
            "SELECT indexdef FROM pg_indexes " +
            "WHERE tablename = 'tickets' " +
            "  AND indexname = 'idx_tickets_search_vector'",
            String.class
        );
        assertThat(indexDefs).hasSize(1);
        assertThat(indexDefs.get(0).toLowerCase()).contains("using gin");
    }

    @Test
    void triggerFunctionExists() {
        int count = jdbc.queryForObject(
            "SELECT count(*) FROM information_schema.routines " +
            "WHERE routine_schema = 'public' " +
            "  AND routine_name = 'tickets_search_vector_update'",
            Integer.class
        );
        assertThat(count).isEqualTo(1);
    }

    @Test
    void triggerExistsBeforeInsertAndUpdate() {
        List<Map<String, Object>> triggers = jdbc.queryForList(
            "SELECT trigger_name, event_manipulation, action_timing " +
            "FROM information_schema.triggers " +
            "WHERE trigger_name = 'tickets_search_vector_trigger' " +
            "ORDER BY event_manipulation"
        );
        // Should fire on both INSERT and UPDATE
        assertThat(triggers).hasSizeGreaterThanOrEqualTo(2);
        triggers.forEach(t -> {
            assertThat(t.get("action_timing")).isEqualTo("BEFORE");
            assertThat(t.get("trigger_name")).isEqualTo("tickets_search_vector_trigger");
        });
        List<Object> events = triggers.stream()
            .map(t -> t.get("event_manipulation"))
            .toList();
        assertThat(events).contains("INSERT", "UPDATE");
    }

    @Test
    @Transactional
    void triggerPopulatesSearchVectorOnInsert() {
        // Insert a ticket with a known description and verify search_vector is populated
        // Note: tickets requires 'status' NOT NULL — all other FK columns are nullable
        jdbc.execute(
            "INSERT INTO tickets (status, description, location) " +
            "VALUES ('open', 'pothole on main street', 'Main Street')"
        );

        // Query back the search_vector for the inserted ticket
        String searchVectorText = jdbc.queryForObject(
            "SELECT search_vector::text FROM tickets WHERE description = 'pothole on main street'",
            String.class
        );

        assertThat(searchVectorText).isNotNull();
        assertThat(searchVectorText).isNotEmpty();

        // Verify that 'pothole' and 'street' appear in the tsvector (weight B terms from description/location)
        assertThat(searchVectorText.toLowerCase()).contains("pothol"); // stemmed form of pothole
    }

    @Test
    @Transactional
    void searchVectorSupportsToTsquerySearch() {
        // Insert two tickets
        jdbc.execute(
            "INSERT INTO tickets (status, description) VALUES ('open', 'broken sidewalk on elm avenue')"
        );
        jdbc.execute(
            "INSERT INTO tickets (status, description) VALUES ('open', 'pothole repair needed')"
        );

        // FTS query: should find the sidewalk ticket but not the pothole ticket
        List<Integer> matchCount = jdbc.queryForList(
            "SELECT id FROM tickets WHERE search_vector @@ to_tsquery('english', 'sidewalk')",
            Integer.class
        );
        assertThat(matchCount).hasSize(1);

        // Both tickets should NOT match a pothole+sidewalk AND query
        List<Integer> noMatch = jdbc.queryForList(
            "SELECT id FROM tickets WHERE search_vector @@ to_tsquery('english', 'sidewalk & pothole')",
            Integer.class
        );
        assertThat(noMatch).isEmpty();
    }
}
