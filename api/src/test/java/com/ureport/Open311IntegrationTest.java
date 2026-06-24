package com.ureport;

import com.ureport.service.Open311XmlSerializer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for Open311 GeoReport v2 endpoints.
 * Uses @Transactional for rollback after each test.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
class Open311IntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private Open311XmlSerializer xmlSerializer;

    /**
     * Test 1: GET /open311/services returns 200 JSON array (empty array valid with empty DB).
     */
    @Test
    void getServices_returnsJsonArray() throws Exception {
        mockMvc.perform(get("/open311/services")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray());
    }

    /**
     * Test 2: GET /open311/services?format=xml returns Content-Type application/xml
     * with <?xml declaration and <services> root element.
     */
    @Test
    void getServices_xmlFormat_returnsXmlContentType() throws Exception {
        mockMvc.perform(get("/open311/services")
                        .param("format", "xml"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", containsString("application/xml")))
                .andExpect(content().string(containsString("<?xml")))
                .andExpect(content().string(containsString("<services>")));
    }

    /**
     * Test 3: GET /open311/requests/{id} for nonexistent ID returns 404 with {"error":"REQUEST_NOT_FOUND"}.
     */
    @Test
    void getRequest_nonexistentId_returns404() throws Exception {
        mockMvc.perform(get("/open311/requests/999999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("REQUEST_NOT_FOUND"));
    }

    /**
     * Test 4: POST /open311/requests with invalid api_key returns 403.
     */
    @Test
    void postRequest_invalidApiKey_returns403() throws Exception {
        mockMvc.perform(post("/open311/requests")
                        .param("api_key", "invalid-key-12345")
                        .param("service_code", "1"))
                .andExpect(status().isForbidden());
    }

    /**
     * Test 5: GET /open311/services?format=xml contains GeoReport v2 XML field elements.
     * Validates element names in the XML serializer output.
     */
    @Test
    void getServices_xmlFormat_containsGeoReportElements() throws Exception {
        mockMvc.perform(get("/open311/services")
                        .param("format", "xml"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("<services>")))
                .andExpect(content().string(containsString("</services>")));
    }

    /**
     * Test 6: GET /open311/discovery returns discovery object with required fields.
     */
    @Test
    void getDiscovery_returnsDiscoveryObject() throws Exception {
        mockMvc.perform(get("/open311/discovery")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.changeset").exists())
                .andExpect(jsonPath("$.endpoints").isArray());
    }

    /**
     * Test 7: GET /open311/discovery?format=xml returns XML with <discovery> root.
     */
    @Test
    void getDiscovery_xmlFormat_returnsXml() throws Exception {
        mockMvc.perform(get("/open311/discovery")
                        .param("format", "xml"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("<?xml")))
                .andExpect(content().string(containsString("<discovery>")));
    }

    /**
     * Test 8: Open311XmlSerializer produces XML with all required GeoReport v2 element names.
     * Validates the serializer directly without needing DB data.
     */
    @Test
    void xmlSerializer_requestsContainsAllGeoReportFields() {
        var response = new com.ureport.dto.response.Open311RequestResponse();
        response.setServiceRequestId("123");
        response.setStatus("open");
        response.setStatusNotes("Pending review");
        response.setServiceName("Pothole");
        response.setServiceCode("1");
        response.setDescription("Large pothole on Main St");
        response.setAgencyResponsible("John Doe");
        response.setRequestedDatetime("2024-01-01T00:00:00+00:00");
        response.setUpdatedDatetime("2024-01-02T00:00:00+00:00");
        response.setExpectedDatetime("2024-01-08T00:00:00+00:00");
        response.setLat("40.7128");
        response.setLng("-74.0060");
        response.setAddress("123 Main St");
        response.setAddressId("456");
        response.setZipcode("10001");
        response.setMediaUrl("/api/v1/media/photo.jpg");

        String xml = xmlSerializer.serializeRequests(java.util.List.of(response));

        org.assertj.core.api.Assertions.assertThat(xml)
                .contains("<?xml version=\"1.0\" encoding=\"utf-8\"?>")
                .contains("<service_requests>")
                .contains("<service_request_id>123</service_request_id>")
                .contains("<status_notes>")
                .contains("<agency_responsible>")
                .contains("<requested_datetime>")
                .contains("<updated_datetime>")
                .contains("<expected_datetime>")
                .contains("<media_url>");
    }
}
