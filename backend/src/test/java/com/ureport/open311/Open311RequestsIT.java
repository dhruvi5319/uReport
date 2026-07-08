package com.ureport.open311;

import com.ureport.domain.*;
import com.ureport.repository.*;
import io.zonky.test.db.AutoConfigureEmbeddedDatabase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@AutoConfigureEmbeddedDatabase(
    provider = AutoConfigureEmbeddedDatabase.DatabaseProvider.ZONKY,
    type = AutoConfigureEmbeddedDatabase.DatabaseType.POSTGRES
)
@Transactional
class Open311RequestsIT {

    @Autowired MockMvc mockMvc;

    @Autowired ClientRepository clientRepository;
    @Autowired CategoryRepository categoryRepository;
    @Autowired CategoryGroupRepository categoryGroupRepository;

    // Test client with known api_key
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
            category.setDescription("Test category for integration tests");
            category.setCategoryGroup(group);
            category.setActive(true);
            categoryRepository.save(category);
        }
    }

    @Test
    void getRequests_returnsJsonArray() throws Exception {
        mockMvc.perform(get("/open311/v2/requests")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    void getRequests_withServiceCodeFilter_filters() throws Exception {
        mockMvc.perform(get("/open311/v2/requests")
                .param("service_code", "1")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    void getRequests_malformedStartDate_returns400() throws Exception {
        mockMvc.perform(get("/open311/v2/requests")
                .param("start_date", "not-a-date")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void getRequest_unknownId_returns404() throws Exception {
        mockMvc.perform(get("/open311/v2/requests/999999")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.errors[0].code").value("requests/unknownRequest"));
    }

    @Test
    void postRequests_missingApiKey_returns403() throws Exception {
        mockMvc.perform(post("/open311/v2/requests")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("service_code", "1")
                .param("description", "Test issue"))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.errors[0].code").value("clients/unknownClient"));
    }

    @Test
    void postRequests_invalidApiKey_returns403() throws Exception {
        mockMvc.perform(post("/open311/v2/requests")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("api_key", "INVALID_KEY_XYZ")
                .param("service_code", "1")
                .param("description", "Test issue"))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.errors[0].code").value("clients/unknownClient"));
    }

    @Test
    void postRequests_validApiKey_createsTicketReturns200() throws Exception {
        // Get an active category id for service_code
        var categories = categoryRepository.findByActiveTrue();
        String serviceCode = categories.isEmpty() ? "1" : categories.get(0).getId().toString();

        mockMvc.perform(post("/open311/v2/requests")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("api_key", TEST_API_KEY)
                .param("service_code", serviceCode)
                .param("description", "Integration test ticket")
                .param("first_name", "Test")
                .param("last_name", "User")
                .param("email", "test@example.com"))
            .andExpect(status().isOk())  // 200, not 201
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$[0].service_request_id").isString());
    }

    @Test
    void getRequests_xmlFormat_returnsXml() throws Exception {
        mockMvc.perform(get("/open311/v2/requests.xml"))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_XML));
    }

    @Test
    void getRequests_noJwtRequired() throws Exception {
        mockMvc.perform(get("/open311/v2/requests"))
            .andExpect(status().isOk());
    }
}
