package com.ureport.smoke;

import io.zonky.test.db.AutoConfigureEmbeddedDatabase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Application smoke tests: verify the Spring Boot application starts,
 * actuator health is UP, Open311 endpoint responds, and security guards
 * reject unauthenticated requests.
 *
 * Uses RANDOM_PORT to avoid conflicts with other tests.
 * Uses Zonky embedded PostgreSQL (consistent with project test architecture).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@AutoConfigureEmbeddedDatabase(
    provider = AutoConfigureEmbeddedDatabase.DatabaseProvider.ZONKY,
    type = AutoConfigureEmbeddedDatabase.DatabaseType.POSTGRES
)
class ApplicationSmokeIT {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    /**
     * T-09-11 regression guard: /actuator/health returns {"status":"UP"}.
     */
    @Test
    void actuatorHealth_returnsUp() {
        ResponseEntity<String> response = restTemplate.getForEntity(url("/actuator/health"), String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("\"status\":\"UP\"");
    }

    /**
     * Open311 GET /services is a public endpoint — returns 200 without credentials.
     */
    @Test
    void open311Services_returnsOk() {
        ResponseEntity<String> response = restTemplate.getForEntity(url("/open311/v2/services"), String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    /**
     * T-09-12 regression guard: POST /api/auth/ldap when ldap.enabled=false
     * returns 503 SERVICE_UNAVAILABLE (LDAP not configured in test profile).
     * See LdapAuthControllerTest for the 401 bad-credentials path (mocked).
     */
    @Test
    void ldapAuth_whenLdapDisabled_returns503() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> request = new HttpEntity<>(
            "{\"username\":\"nobody\",\"password\":\"wrong\"}", headers);
        ResponseEntity<String> response = restTemplate.postForEntity(
            url("/api/auth/ldap"), request, String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
    }

    /**
     * T-09-11 regression guard: GET /api/tickets with no auth returns 401.
     * Confirms Spring Security route guard is active for ticket endpoints.
     */
    @Test
    void ticketsEndpoint_withNoAuth_returns401() {
        ResponseEntity<String> response = restTemplate.getForEntity(url("/api/tickets"), String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
