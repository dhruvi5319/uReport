package com.ureport.open311;

import io.zonky.test.db.AutoConfigureEmbeddedDatabase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@AutoConfigureEmbeddedDatabase(
    provider = AutoConfigureEmbeddedDatabase.DatabaseProvider.ZONKY,
    type = AutoConfigureEmbeddedDatabase.DatabaseType.POSTGRES
)
class Open311ServicesIT {

    @Autowired MockMvc mockMvc;

    @Test
    void getServices_returnsJsonArray() throws Exception {
        mockMvc.perform(get("/open311/v2/services")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    void getServices_xmlSuffix_returnsXmlContentType() throws Exception {
        mockMvc.perform(get("/open311/v2/services.xml"))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_XML));
    }

    @Test
    void getServices_formatParam_returnsXml() throws Exception {
        mockMvc.perform(get("/open311/v2/services?format=xml"))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_XML));
    }

    @Test
    void getServices_obsoleteApiKey_returnsThreeSyntheticEntries() throws Exception {
        // OPEN311_OBSOLETE_API_KEYS=test-obsolete-key is set via application-test.yml
        mockMvc.perform(get("/open311/v2/services")
                .param("api_key", "test-obsolete-key")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(3))
            .andExpect(jsonPath("$[0].service_code").value("XXX"))
            .andExpect(jsonPath("$[0].service_name").value("to work in mobile web browsers"))
            .andExpect(jsonPath("$[2].group").value("bloomington.in.gov/ureport"));
    }

    @Test
    void getService_unknownCode_returns404() throws Exception {
        mockMvc.perform(get("/open311/v2/services/999999")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.errors[0].code").exists());
    }

    @Test
    void getServices_noJwtRequired_returnsOk() throws Exception {
        // Confirm public access — no Authorization header or cookie
        mockMvc.perform(get("/open311/v2/services"))
            .andExpect(status().isOk());
    }
}
