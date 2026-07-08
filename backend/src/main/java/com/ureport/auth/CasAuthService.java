package com.ureport.auth;

import com.ureport.domain.Person;
import com.ureport.repository.PersonRepository;
import com.ureport.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

@Service
public class CasAuthService {

    private final JwtService jwtService;
    private final PersonRepository personRepository;
    private final RestTemplate restTemplate;

    @Value("${cas.enabled:false}")
    private boolean casEnabled;

    @Value("${cas.server-url:https://cas.city.gov}")
    private String casServerUrl;

    @Value("${cas.service-url:https://ureport.city.gov}")
    private String casServiceUrl;

    @Autowired
    public CasAuthService(JwtService jwtService, PersonRepository personRepository) {
        this.jwtService = jwtService;
        this.personRepository = personRepository;
        this.restTemplate = new RestTemplate();
    }

    // Constructor for testing — allows injecting a mock RestTemplate
    public CasAuthService(JwtService jwtService, PersonRepository personRepository,
                          RestTemplate restTemplate) {
        this.jwtService = jwtService;
        this.personRepository = personRepository;
        this.restTemplate = restTemplate;
    }

    /**
     * Build the CAS login URL that the browser should be redirected to.
     * Format: {casServer}/login?service={serviceUrl}/auth/cas/callback
     */
    public String buildCasLoginUrl() {
        try {
            String encodedService = java.net.URLEncoder.encode(
                    casServiceUrl + "/auth/cas/callback", StandardCharsets.UTF_8);
            return casServerUrl + "/login?service=" + encodedService;
        } catch (Exception e) {
            throw new RuntimeException("Failed to build CAS login URL", e);
        }
    }

    /**
     * Build the CAS logout URL.
     */
    public String buildCasLogoutUrl() {
        return casServerUrl + "/logout";
    }

    /**
     * Validate a CAS service ticket by calling {casServer}/serviceValidate.
     * Returns a signed JWT string on success.
     * Throws CasAuthException on ticket validation failure.
     * Throws IllegalStateException if cas.enabled=false.
     *
     * @param ticket     The service ticket received in ?ticket= query param
     * @param serviceUrl The service URL (must match what was sent to CAS login)
     */
    public String validateTicket(String ticket, String serviceUrl) {
        if (!casEnabled) {
            throw new IllegalStateException("CAS authentication is not enabled");
        }

        // Call CAS /serviceValidate endpoint
        String validateUrl = casServerUrl + "/serviceValidate?ticket=" +
                encode(ticket) + "&service=" + encode(serviceUrl);

        String xmlResponse;
        try {
            xmlResponse = restTemplate.getForObject(validateUrl, String.class);
        } catch (Exception e) {
            throw new CasAuthException("CAS server unreachable: " + e.getMessage());
        }

        if (xmlResponse == null || xmlResponse.isBlank()) {
            throw new CasAuthException("Empty response from CAS /serviceValidate");
        }

        // Parse XML response
        String username = parseUsernameFromCasResponse(xmlResponse);

        // Look up or create Person record
        Person person = personRepository.findByUsername(username)
                .orElseGet(() -> {
                    Person newPerson = new Person(username, "staff"); // default role for CAS users
                    return personRepository.save(newPerson);
                });

        return jwtService.generateToken(person.getId(), person.getUsername(), person.getRole());
    }

    /**
     * Parse the CAS serviceValidate XML response.
     * Returns the username on success; throws CasAuthException on failure.
     */
    private String parseUsernameFromCasResponse(String xml) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            // Prevent XXE attacks — disable external entities
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            factory.setNamespaceAware(true);

            DocumentBuilder builder = factory.newDocumentBuilder();
            org.w3c.dom.Document doc = builder.parse(
                    new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));
            doc.getDocumentElement().normalize();

            // Check for success: <cas:authenticationSuccess><cas:user>username</cas:user>
            org.w3c.dom.NodeList successNodes = doc.getElementsByTagNameNS(
                    "http://www.yale.edu/tp/cas", "authenticationSuccess");
            if (successNodes.getLength() > 0) {
                org.w3c.dom.NodeList userNodes = doc.getElementsByTagNameNS(
                        "http://www.yale.edu/tp/cas", "user");
                if (userNodes.getLength() > 0) {
                    String username = userNodes.item(0).getTextContent().trim();
                    if (username.isBlank()) {
                        throw new CasAuthException("CAS returned empty username");
                    }
                    return username;
                }
            }

            // Check for failure: <cas:authenticationFailure>
            org.w3c.dom.NodeList failureNodes = doc.getElementsByTagNameNS(
                    "http://www.yale.edu/tp/cas", "authenticationFailure");
            if (failureNodes.getLength() > 0) {
                String failureCode = failureNodes.item(0).getAttributes()
                        .getNamedItem("code") != null
                        ? failureNodes.item(0).getAttributes().getNamedItem("code").getTextContent()
                        : "UNKNOWN";
                throw new CasAuthException("CAS ticket validation failed: " + failureCode);
            }

            throw new CasAuthException("Unexpected CAS response format");

        } catch (CasAuthException e) {
            throw e;
        } catch (Exception e) {
            throw new CasAuthException("Failed to parse CAS XML response: " + e.getMessage());
        }
    }

    private String encode(String value) {
        try {
            return java.net.URLEncoder.encode(value, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return value;
        }
    }

    /** Marker exception for CAS validation failures. */
    public static class CasAuthException extends RuntimeException {
        public CasAuthException(String message) { super(message); }
    }
}
