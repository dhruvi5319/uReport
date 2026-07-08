package com.ureport.auth;

import com.ureport.domain.Person;
import com.ureport.repository.PersonRepository;
import com.ureport.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CasAuthServiceTest {

    @Mock JwtService jwtService;
    @Mock PersonRepository personRepository;
    @Mock RestTemplate restTemplate;

    CasAuthService casAuthService;

    // Valid CAS /serviceValidate XML success response
    private static final String VALID_CAS_RESPONSE = """
            <?xml version="1.0" encoding="UTF-8"?>
            <cas:serviceResponse xmlns:cas='http://www.yale.edu/tp/cas'>
              <cas:authenticationSuccess>
                <cas:user>jsmith</cas:user>
              </cas:authenticationSuccess>
            </cas:serviceResponse>
            """;

    // CAS /serviceValidate XML failure response
    private static final String INVALID_CAS_RESPONSE = """
            <?xml version="1.0" encoding="UTF-8"?>
            <cas:serviceResponse xmlns:cas='http://www.yale.edu/tp/cas'>
              <cas:authenticationFailure code="INVALID_TICKET">
                Ticket 'ST-bad-123' not recognized
              </cas:authenticationFailure>
            </cas:serviceResponse>
            """;

    @BeforeEach
    void setUp() {
        casAuthService = new CasAuthService(jwtService, personRepository, restTemplate);
        // Set @Value fields via ReflectionTestUtils
        ReflectionTestUtils.setField(casAuthService, "casEnabled", true);
        ReflectionTestUtils.setField(casAuthService, "casServerUrl", "https://cas.test.gov");
        ReflectionTestUtils.setField(casAuthService, "casServiceUrl", "https://ureport.test.gov");
    }

    @Test
    void validateTicket_validXmlResponse_returnsJwt() {
        Person person = new Person("jsmith", "staff");
        ReflectionTestUtils.setField(person, "id", 42L);

        when(restTemplate.getForObject(anyString(), eq(String.class)))
                .thenReturn(VALID_CAS_RESPONSE);
        when(personRepository.findByUsername("jsmith")).thenReturn(Optional.of(person));
        when(jwtService.generateToken(42L, "jsmith", "staff")).thenReturn("jwt.token.here");

        String result = casAuthService.validateTicket("ST-valid-ticket", "https://ureport.test.gov/auth/cas/callback");

        assertThat(result).isEqualTo("jwt.token.here");
        verify(jwtService).generateToken(42L, "jsmith", "staff");
    }

    @Test
    void validateTicket_invalidTicket_throwsCasAuthException() {
        when(restTemplate.getForObject(anyString(), eq(String.class)))
                .thenReturn(INVALID_CAS_RESPONSE);

        assertThatThrownBy(() ->
                casAuthService.validateTicket("ST-bad-123", "https://ureport.test.gov/auth/cas/callback"))
                .isInstanceOf(CasAuthService.CasAuthException.class)
                .hasMessageContaining("INVALID_TICKET");
    }

    @Test
    void validateTicket_casDisabled_throwsIllegalStateException() {
        ReflectionTestUtils.setField(casAuthService, "casEnabled", false);

        assertThatThrownBy(() ->
                casAuthService.validateTicket("ST-any", "https://ureport.test.gov/auth/cas/callback"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not enabled");
    }

    @Test
    void validateTicket_newUser_createsPersonWithStaffRole() {
        when(restTemplate.getForObject(anyString(), eq(String.class)))
                .thenReturn(VALID_CAS_RESPONSE);
        when(personRepository.findByUsername("jsmith")).thenReturn(Optional.empty());

        Person savedPerson = new Person("jsmith", "staff");
        ReflectionTestUtils.setField(savedPerson, "id", 99L);
        when(personRepository.save(any(Person.class))).thenReturn(savedPerson);
        when(jwtService.generateToken(99L, "jsmith", "staff")).thenReturn("new.jwt.token");

        String result = casAuthService.validateTicket("ST-valid-new", "https://ureport.test.gov/auth/cas/callback");

        assertThat(result).isEqualTo("new.jwt.token");
        verify(personRepository).save(argThat(p -> "jsmith".equals(p.getUsername()) && "staff".equals(p.getRole())));
    }

    @Test
    void buildCasLoginUrl_returnsCorrectUrl() {
        String loginUrl = casAuthService.buildCasLoginUrl();

        assertThat(loginUrl).startsWith("https://cas.test.gov/login?service=");
        assertThat(loginUrl).contains("ureport.test.gov");
        assertThat(loginUrl).contains("auth%2Fcas%2Fcallback");
    }
}
