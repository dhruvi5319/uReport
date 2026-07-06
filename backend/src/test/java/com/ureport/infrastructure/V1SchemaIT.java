package com.ureport.infrastructure;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test: verifies that Flyway V1__initial_schema.sql created
 * all 21 expected tables with key constraints and seed data.
 */
@SpringBootTest
@ActiveProfiles("test")
class V1SchemaIT {

    @Autowired
    private JdbcTemplate jdbc;

    private static final List<String> EXPECTED_TABLES = List.of(
        "contact_methods", "substatus", "actions", "issue_types",
        "category_groups", "departments", "people", "people_emails",
        "people_phones", "people_addresses", "clients", "categories",
        "category_action_responses", "department_actions",
        "department_categories", "tickets", "ticket_history",
        "media", "bookmarks", "geoclusters", "ticket_geodata"
    );

    @Test
    void allExpectedTablesExist() {
        List<String> tables = jdbc.queryForList(
            "SELECT table_name FROM information_schema.tables " +
            "WHERE table_schema = 'public' AND table_type = 'BASE TABLE' " +
            "ORDER BY table_name",
            String.class
        );
        assertThat(tables).containsAll(EXPECTED_TABLES);
    }

    @Test
    void contactMethodsSeedDataPresent() {
        int count = jdbc.queryForObject(
            "SELECT count(*) FROM contact_methods", Integer.class);
        assertThat(count).isEqualTo(4);
        List<String> names = jdbc.queryForList(
            "SELECT name FROM contact_methods ORDER BY name", String.class);
        assertThat(names).containsExactlyInAnyOrder("Email", "Phone", "Web Form", "Other");
    }

    @Test
    void substatusSeedDataPresent() {
        int count = jdbc.queryForObject(
            "SELECT count(*) FROM substatus", Integer.class);
        assertThat(count).isEqualTo(3);
        List<String> names = jdbc.queryForList(
            "SELECT name FROM substatus ORDER BY name", String.class);
        assertThat(names).containsExactlyInAnyOrder("Bogus", "Duplicate", "Resolved");
    }

    @Test
    void actionsSeedDataPresent() {
        int count = jdbc.queryForObject(
            "SELECT count(*) FROM actions", Integer.class);
        assertThat(count).isEqualTo(10);
    }

    @Test
    void issueTypesSeedDataPresent() {
        int count = jdbc.queryForObject(
            "SELECT count(*) FROM issue_types", Integer.class);
        assertThat(count).isEqualTo(6);
        List<String> names = jdbc.queryForList(
            "SELECT name FROM issue_types ORDER BY name", String.class);
        assertThat(names).containsExactlyInAnyOrder(
            "Comment", "Complaint", "Question", "Report", "Request", "Violation");
    }

    @Test
    void categoryGroupsSeedDataPresent() {
        int count = jdbc.queryForObject(
            "SELECT count(*) FROM category_groups", Integer.class);
        assertThat(count).isEqualTo(3);
    }

    @Test
    void peopleTableHasExpectedColumns() {
        List<String> cols = jdbc.queryForList(
            "SELECT column_name FROM information_schema.columns " +
            "WHERE table_schema = 'public' AND table_name = 'people' " +
            "ORDER BY column_name",
            String.class
        );
        assertThat(cols).contains(
            "id", "firstname", "middlename", "lastname",
            "organization", "address", "city", "state", "zip",
            "department_id", "username", "role"
        );
    }

    @Test
    void ticketsTableHasExpectedColumns() {
        List<String> cols = jdbc.queryForList(
            "SELECT column_name FROM information_schema.columns " +
            "WHERE table_schema = 'public' AND table_name = 'tickets' " +
            "ORDER BY column_name",
            String.class
        );
        assertThat(cols).contains(
            "id", "parent_id", "category_id", "issue_type_id", "client_id",
            "entered_by_person_id", "reported_by_person_id", "assigned_person_id",
            "contact_method_id", "response_method_id",
            "entered_date", "last_modified", "address_id",
            "latitude", "longitude", "location", "city", "state", "zip",
            "status", "closed_date", "substatus_id",
            "additional_fields", "custom_fields", "description"
        );
    }

    @Test
    void booleanColumnsAreNotTinyint() {
        // Verify DB-01: TINYINT(1) replaced by BOOLEAN in PostgreSQL
        List<String> booleanCols = jdbc.queryForList(
            "SELECT column_name FROM information_schema.columns " +
            "WHERE table_schema = 'public' " +
            "  AND data_type = 'boolean' " +
            "ORDER BY table_name, column_name",
            String.class
        );
        // Expected boolean columns from schema
        assertThat(booleanCols).contains(
            "is_default",          // substatus
            "used_for_notifications", // people_emails
            "active",              // categories
            "featured",            // categories
            "auto_close_is_active" // categories
        );
    }

    @Test
    void foreignKeyConstraintOnDepartmentsExists() {
        int count = jdbc.queryForObject(
            "SELECT count(*) FROM information_schema.table_constraints " +
            "WHERE table_schema = 'public' " +
            "  AND table_name = 'departments' " +
            "  AND constraint_type = 'FOREIGN KEY' " +
            "  AND constraint_name = 'fk_departments_default_person'",
            Integer.class
        );
        assertThat(count).isEqualTo(1);
    }

    @Test
    void keyIndexesExist() {
        List<String> indexes = jdbc.queryForList(
            "SELECT indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname",
            String.class
        );
        assertThat(indexes).contains(
            "idx_people_username",
            "idx_people_lastname",
            "idx_people_department_id",
            "idx_tickets_status",
            "idx_tickets_entered_date",
            "idx_tickets_category_id",
            "idx_ticket_history_ticket_id",
            "idx_media_ticket_id",
            "idx_bookmarks_person_id",
            "idx_geoclusters_level"
        );
    }
}
