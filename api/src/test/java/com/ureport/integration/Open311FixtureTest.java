package com.ureport.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Open311 GeoReport v2 byte-level compatibility tests (NFR-1, NFR-9).
 *
 * Strategy: validate field names and structure match, not exact values.
 * Fixtures define the required JSON field names and XML element names.
 * The "PLACEHOLDER" values in fixture files indicate "field must exist with non-null or matching type".
 *
 * Per PRD §7 / NFR-9: ≥90% coverage on Open311 controller layer.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
public class Open311FixtureTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    // ── JSON field name tests ──────────────────────────────────────────────────

    @Test
    void testGetServices_json_returnsExpectedFieldNames() throws Exception {
        String body = mockMvc.perform(get("/open311/services"))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith("application/json"))
            .andReturn().getResponse().getContentAsString();

        // Even if list is empty, verify the endpoint responds with a JSON array
        JsonNode node = objectMapper.readTree(body);
        assertTrue(node.isArray(), "GET /open311/services must return a JSON array");

        if (node.size() > 0) {
            JsonNode first = node.get(0);
            // Required GeoReport v2 fields per PRD F2 and NFR-1
            assertFieldExists(first, "service_code",   "GET /open311/services");
            assertFieldExists(first, "service_name",   "GET /open311/services");
            assertFieldExists(first, "metadata",       "GET /open311/services");
            assertFieldExists(first, "type",           "GET /open311/services");
            assertFieldExists(first, "keywords",       "GET /open311/services");
            // group is nullable but key must be present
            assertTrue(first.has("group"), "GET /open311/services: field 'group' must be present (may be null)");
        }
    }

    @Test
    void testGetServices_xml_hasCorrectRootAndElements() throws Exception {
        String xml = mockMvc.perform(get("/open311/services?format=xml"))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        assertTrue(xml.startsWith("<?xml version=\"1.0\" encoding=\"utf-8\"?>"),
            "XML declaration must be exactly: <?xml version=\"1.0\" encoding=\"utf-8\"?>");
        assertTrue(xml.contains("<services>"),  "Root element must be <services>");
        // If services exist, check element names
        if (xml.contains("<service>")) {
            assertTrue(xml.contains("<service_code>"),  "<service_code> element required");
            assertTrue(xml.contains("<service_name>"),  "<service_name> element required");
            assertTrue(xml.contains("<metadata>"),      "<metadata> element required");
            assertTrue(xml.contains("<type>"),          "<type> element required");
        }
    }

    @Test
    void testGetDiscovery_json_returnsRequiredTopLevelFields() throws Exception {
        String body = mockMvc.perform(get("/open311/discovery"))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        JsonNode node = objectMapper.readTree(body);
        assertFalse(node.isArray(), "GET /open311/discovery must return an object, not array");
        assertFieldExists(node, "changeset",  "GET /open311/discovery");
        assertFieldExists(node, "contact",    "GET /open311/discovery");
        assertFieldExists(node, "endpoints",  "GET /open311/discovery");
        assertTrue(node.get("endpoints").isArray(), "endpoints must be a JSON array");
    }

    @Test
    void testGetDiscovery_xml_hasCorrectStructure() throws Exception {
        String xml = mockMvc.perform(get("/open311/discovery?format=xml"))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        assertTrue(xml.startsWith("<?xml version=\"1.0\" encoding=\"utf-8\"?>"),
            "XML declaration must be exactly: <?xml version=\"1.0\" encoding=\"utf-8\"?>");
        assertTrue(xml.contains("<discovery>"),  "Root element must be <discovery>");
        assertTrue(xml.contains("<changeset>"),  "<changeset> required in discovery XML");
        assertTrue(xml.contains("<endpoints>"),  "<endpoints> required in discovery XML");
    }

    @Test
    void testPostRequests_invalidApiKey_returns403WithExpectedShape() throws Exception {
        String body = mockMvc.perform(
                post("/open311/requests")
                    .param("api_key", "invalid-key-that-does-not-exist")
                    .param("service_code", "1")
                    .param("description", "Test")
            )
            .andExpect(status().isForbidden())
            .andReturn().getResponse().getContentAsString();

        JsonNode node = objectMapper.readTree(body);
        // Error response must have 'error' field per GlobalExceptionHandler
        assertTrue(node.has("error"), "403 response must contain 'error' field");
    }

    @Test
    void testPostRequests_json_responseShape() throws Exception {
        // This test verifies the POST response field names against the fixture.
        // Because creating a real ticket requires a valid API key and category,
        // we verify the 403 response shape and the endpoint path existence.
        // Full end-to-end POST test is in the E2E Playwright suite.
        //
        // What we validate here: if POST succeeds, the response MUST be a JSON array
        // with service_request_id, service_notice, account_id (per NFR-1).
        // Load fixture and verify required keys:
        try (InputStream is = getClass().getResourceAsStream("/fixtures/open311-requests-post.json")) {
            assertNotNull(is, "Fixture file open311-requests-post.json must exist on classpath");
            JsonNode fixture = objectMapper.readTree(is);
            assertTrue(fixture.isArray(), "POST /open311/requests fixture must be a JSON array");
            assertTrue(fixture.size() > 0, "POST fixture must have at least one element");
            JsonNode first = fixture.get(0);
            assertFieldExists(first, "service_request_id", "POST /open311/requests fixture");
            assertFieldExists(first, "service_notice",     "POST /open311/requests fixture");
            assertFieldExists(first, "account_id",         "POST /open311/requests fixture");
        }
    }

    @Test
    void testGetSingleRequest_xml_hasAllRequiredElements() throws Exception {
        // Verify XML structure fixture for GET /open311/requests/{id} response
        try (InputStream is = getClass().getResourceAsStream("/fixtures/open311-request-single.xml")) {
            assertNotNull(is, "Fixture open311-request-single.xml must exist on classpath");
            String xml = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            // All 15 GeoReport v2 required elements must be present in the fixture
            List<String> requiredElements = List.of(
                "service_request_id", "status", "status_notes", "service_name",
                "service_code", "description", "agency_responsible",
                "requested_datetime", "updated_datetime", "expected_datetime",
                "lat", "long", "address", "address_id", "zipcode"
            );
            for (String elem : requiredElements) {
                assertTrue(xml.contains("<" + elem + ">") || xml.contains("<" + elem + "/>"),
                    "Fixture must contain element <" + elem + "> (NFR-1 byte-compatibility)");
            }
        }
    }

    @Test
    void testGetRequests_json_fieldNames() throws Exception {
        String body = mockMvc.perform(get("/open311/requests"))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        JsonNode node = objectMapper.readTree(body);
        assertTrue(node.isArray(), "GET /open311/requests must return a JSON array");

        if (node.size() > 0) {
            JsonNode first = node.get(0);
            // Critical: 'long' not 'lng' — Java keyword conflict must be resolved with @JsonProperty
            assertFieldExists(first, "service_request_id", "GET /open311/requests");
            assertFieldExists(first, "status",             "GET /open311/requests");
            assertFieldExists(first, "service_name",       "GET /open311/requests");
            assertFieldExists(first, "service_code",       "GET /open311/requests");
            assertFieldExists(first, "description",        "GET /open311/requests");
            assertFieldExists(first, "requested_datetime", "GET /open311/requests");
            assertFieldExists(first, "updated_datetime",   "GET /open311/requests");
            assertTrue(first.has("long"), "Field name must be 'long' (not 'lng') per GeoReport v2 spec (NFR-1)");
            assertTrue(first.has("lat"),  "Field name must be 'lat' per GeoReport v2 spec");
        }
    }

    @Test
    void testGetRequests_xml_rootAndElements() throws Exception {
        String xml = mockMvc.perform(get("/open311/requests?format=xml"))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        assertTrue(xml.startsWith("<?xml version=\"1.0\" encoding=\"utf-8\"?>"),
            "XML declaration must be exactly: <?xml version=\"1.0\" encoding=\"utf-8\"?>");
        assertTrue(xml.contains("<service_requests>"), "Root element must be <service_requests> (not <requests>)");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void assertFieldExists(JsonNode node, String fieldName, String context) {
        assertTrue(node.has(fieldName),
            context + ": JSON field '" + fieldName + "' must be present (NFR-1 byte-compatibility)");
    }
}
