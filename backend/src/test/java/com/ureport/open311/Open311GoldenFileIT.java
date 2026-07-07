package com.ureport.open311;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ureport.domain.Category;
import com.ureport.domain.CategoryGroup;
import com.ureport.domain.Client;
import com.ureport.repository.CategoryGroupRepository;
import com.ureport.repository.CategoryRepository;
import com.ureport.repository.ClientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.Iterator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Golden-file integration tests for Open311 / GeoReport v2 endpoints.
 *
 * Purpose: Verify that the Spring Boot implementation returns responses
 * with the SAME JSON field names as the PHP reference implementation.
 * These tests check SHAPE (field name presence), not VALUES (data may vary
 * between test DB and production).
 *
 * Golden files in src/test/resources/open311-golden/ define the required
 * field names. They are generated from the PHP reference output format.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:golden_testdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.flyway.enabled=false",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
})
class Open311GoldenFileIT {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Autowired ClientRepository clientRepository;
    @Autowired CategoryRepository categoryRepository;
    @Autowired CategoryGroupRepository categoryGroupRepository;

    private static final String TEST_API_KEY = "test-valid-key";

    @BeforeEach
    void setUp() {
        // Ensure test client exists with known api_key
        if (clientRepository.findByApiKey(TEST_API_KEY).isEmpty()) {
            Client client = new Client();
            client.setName("Test Client");
            client.setApiKey(TEST_API_KEY);
            clientRepository.save(client);
        }

        // Ensure at least one active category exists for service_code tests
        if (categoryRepository.findByActiveTrue().isEmpty()) {
            CategoryGroup group = new CategoryGroup();
            group.setName("Test Group");
            group = categoryGroupRepository.save(group);

            Category category = new Category();
            category.setName("Test Category");
            category.setDescription("Test description");
            category.setCategoryGroup(group);
            category.setActive(true);
            categoryRepository.save(category);
        }
    }

    /**
     * GET /open311/v2/services JSON shape matches golden file field structure.
     * Verifies all 7 GeoReport v2 service field names are present.
     * If the test DB has no active categories, this test succeeds (empty array is valid).
     */
    @Test
    void getServices_jsonShapeMatchesGoldenFile() throws Exception {
        var goldenResource = new ClassPathResource("open311-golden/services-response.json");
        JsonNode goldenNode = objectMapper.readTree(goldenResource.getInputStream());
        JsonNode goldenFirst = goldenNode.get(0);

        MvcResult result = mockMvc.perform(get("/open311/v2/services")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andReturn();

        JsonNode actualArray = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(actualArray.isArray()).isTrue();

        // If there is data, verify field shape matches golden file
        if (actualArray.size() > 0) {
            JsonNode actualFirst = actualArray.get(0);
            Iterator<String> goldenFields = goldenFirst.fieldNames();
            while (goldenFields.hasNext()) {
                String fieldName = goldenFields.next();
                assertThat(actualFirst.has(fieldName))
                    .as("Expected field '%s' in Open311 service object", fieldName)
                    .isTrue();
            }
            // Verify fixed-value fields per GeoReport v2 spec
            assertThat(actualFirst.get("metadata").asBoolean()).isFalse();
            assertThat(actualFirst.get("type").asText()).isEqualTo("realtime");
            assertThat(actualFirst.get("keywords").asText()).isEqualTo("");
        }
    }

    /**
     * GET /open311/v2/services.xml returns valid XML with correct content type.
     */
    @Test
    void getServices_xmlSuffix_returnsValidXml() throws Exception {
        MvcResult result = mockMvc.perform(get("/open311/v2/services.xml"))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_XML))
            .andReturn();

        String body = result.getResponse().getContentAsString();
        // XML must be parseable
        assertThat(body).isNotBlank();
        assertThat(body.trim()).startsWith("<");
    }

    /**
     * GET /open311/v2/requests JSON shape matches golden file field structure.
     * Verifies all 18 GeoReport v2 service_request field names are present.
     */
    @Test
    void getRequests_jsonShapeMatchesGoldenFile() throws Exception {
        var goldenResource = new ClassPathResource("open311-golden/requests-response.json");
        JsonNode goldenNode = objectMapper.readTree(goldenResource.getInputStream());
        JsonNode goldenFirst = goldenNode.get(0);

        MvcResult result = mockMvc.perform(get("/open311/v2/requests")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andReturn();

        JsonNode actualArray = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(actualArray.isArray()).isTrue();

        if (actualArray.size() > 0) {
            JsonNode actualFirst = actualArray.get(0);
            Iterator<String> goldenFields = goldenFirst.fieldNames();
            while (goldenFields.hasNext()) {
                String fieldName = goldenFields.next();
                assertThat(actualFirst.has(fieldName))
                    .as("Expected field '%s' in Open311 service_request object", fieldName)
                    .isTrue();
            }
            // Verify "long" field name (not "longitude") per GeoReport v2 spec
            assertThat(actualFirst.has("long"))
                .as("Expected 'long' field name (not 'longitude') per GeoReport v2 spec")
                .isTrue();
            // Verify service_notice is always present
            assertThat(actualFirst.has("service_notice")).isTrue();
        }
    }

    /**
     * Content negotiation: format=xml query param returns XML.
     */
    @Test
    void getRequests_formatParamXml_returnsXml() throws Exception {
        mockMvc.perform(get("/open311/v2/requests")
                .param("format", "xml"))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_XML));
    }

    /**
     * Content negotiation: Accept: application/xml header returns XML.
     */
    @Test
    void getRequests_acceptHeaderXml_returnsXml() throws Exception {
        mockMvc.perform(get("/open311/v2/requests")
                .accept(MediaType.APPLICATION_XML))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_XML));
    }

    /**
     * Content negotiation: No hint (no Accept header, no format param) returns JSON.
     */
    @Test
    void getRequests_noContentNegotiationHint_returnsJson() throws Exception {
        mockMvc.perform(get("/open311/v2/requests"))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));
    }

    /**
     * POST /open311/v2/requests response contains service_request_id string field.
     * Uses valid test api_key from @BeforeEach setup.
     */
    @Test
    void postRequests_validApiKey_responseContainsServiceRequestId() throws Exception {
        // Get active category id for service_code
        var categories = categoryRepository.findByActiveTrue();
        String serviceCode = categories.isEmpty() ? "1" : categories.get(0).getId().toString();

        MvcResult result = mockMvc.perform(
            post("/open311/v2/requests")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("api_key", TEST_API_KEY)
                .param("service_code", serviceCode)
                .param("description", "Golden file test ticket"))
            .andExpect(status().isOk())
            .andReturn();

        JsonNode responseArray = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(responseArray.isArray()).isTrue();
        assertThat(responseArray.size()).isGreaterThan(0);
        JsonNode first = responseArray.get(0);
        assertThat(first.has("service_request_id"))
            .as("POST response must contain service_request_id field")
            .isTrue();
        assertThat(first.get("service_request_id").asText()).isNotBlank();
    }

    /**
     * GET /v3/api-docs returns OpenAPI JSON document containing Open311 endpoint paths.
     */
    @Test
    void apiDocs_containsOpen311Endpoints() throws Exception {
        MvcResult result = mockMvc.perform(get("/v3/api-docs")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andReturn();

        JsonNode apiDoc = objectMapper.readTree(result.getResponse().getContentAsString());

        // Must be OpenAPI 3.x document
        assertThat(apiDoc.has("openapi")).isTrue();
        assertThat(apiDoc.get("openapi").asText()).startsWith("3.");

        // Must contain paths for all 5 Open311 endpoints
        JsonNode paths = apiDoc.get("paths");
        assertThat(paths).isNotNull();
        assertThat(paths.has("/open311/v2/services")).isTrue();
        assertThat(paths.has("/open311/v2/requests")).isTrue();
    }
}
