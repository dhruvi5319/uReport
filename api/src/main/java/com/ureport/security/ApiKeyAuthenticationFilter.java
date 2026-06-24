package com.ureport.security;

import com.ureport.repository.ClientRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

/**
 * Intercepts POST /open311/requests to validate api_key via SHA-256 lookup + BCrypt verify.
 * Obsolete keys are flagged as request attributes so the controller can return the shutdown payload.
 */
@Component
public class ApiKeyAuthenticationFilter extends OncePerRequestFilter {

    @Value("${app.open311.obsoleteApiKeys:}")
    private String obsoleteApiKeysConfig;

    private final ClientRepository clientRepository;
    private final PasswordEncoder passwordEncoder;

    public ApiKeyAuthenticationFilter(ClientRepository clientRepository,
                                      PasswordEncoder passwordEncoder) {
        this.clientRepository = clientRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        // Only intercept POST /open311/requests — GET requests are public
        if (!request.getRequestURI().startsWith("/open311/requests")
                || !"POST".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String apiKey = request.getParameter("api_key");
        if (apiKey == null || apiKey.isBlank()) {
            writeError(response, HttpServletResponse.SC_FORBIDDEN,
                    "API_KEY_INVALID", "Invalid or missing api_key");
            return;
        }

        // Check obsolete API keys first — set attribute and let controller return shutdown payload
        List<String> obsoleteKeys = parseObsoleteKeys(obsoleteApiKeysConfig);
        if (obsoleteKeys.contains(apiKey)) {
            request.setAttribute("obsoleteApiKey", Boolean.TRUE);
            // Authenticate as anonymous so the request passes security filter chain
            SecurityContextHolder.getContext().setAuthentication(new ApiKeyPrincipal(-1));
            filterChain.doFilter(request, response);
            return;
        }

        // SHA-256 hash for lookup (api_key_lookup column)
        String sha256hex = DigestUtils.sha256Hex(apiKey);

        var clientOpt = clientRepository.findByApiKeyLookup(sha256hex);
        if (clientOpt.isEmpty()) {
            writeError(response, HttpServletResponse.SC_FORBIDDEN,
                    "API_KEY_INVALID", "Invalid or missing api_key");
            return;
        }

        var client = clientOpt.get();
        if (!passwordEncoder.matches(apiKey, client.getApiKeyHash())) {
            writeError(response, HttpServletResponse.SC_FORBIDDEN,
                    "API_KEY_INVALID", "Invalid or missing api_key");
            return;
        }

        SecurityContextHolder.getContext().setAuthentication(new ApiKeyPrincipal(client.getId()));
        filterChain.doFilter(request, response);
    }

    private List<String> parseObsoleteKeys(String config) {
        if (config == null || config.isBlank()) return List.of();
        return Arrays.stream(config.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    private void writeError(HttpServletResponse response, int status, String error, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"" + error + "\",\"message\":\"" + message + "\"}");
    }
}
