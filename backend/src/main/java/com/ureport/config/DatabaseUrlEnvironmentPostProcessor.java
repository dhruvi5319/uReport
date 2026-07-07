package com.ureport.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.HashMap;
import java.util.Map;

/**
 * Converts platform-injected DATABASE_URL (postgres:// format) to JDBC URL
 * format (jdbc:postgresql://) and extracts username/password.
 *
 * This runs before Spring Boot's auto-configuration so the datasource
 * picks up the correct URL.
 */
public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment,
                                       SpringApplication application) {
        String databaseUrl = environment.getProperty("DATABASE_URL");
        if (databaseUrl == null || databaseUrl.isBlank()) return;

        // Only convert if not already in jdbc: format
        if (databaseUrl.startsWith("jdbc:")) return;

        Map<String, Object> props = new HashMap<>();

        try {
            // postgres://user:pass@host:port/db
            String url = databaseUrl;
            String username = null;
            String password = null;

            if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
                String schemeRemoved = url.contains("://") ? url.substring(url.indexOf("://") + 3) : url;
                int atIdx = schemeRemoved.indexOf('@');
                if (atIdx >= 0) {
                    String credentials = schemeRemoved.substring(0, atIdx);
                    String hostAndDb = schemeRemoved.substring(atIdx + 1);
                    int colonIdx = credentials.indexOf(':');
                    if (colonIdx >= 0) {
                        username = credentials.substring(0, colonIdx);
                        password = credentials.substring(colonIdx + 1);
                    } else {
                        username = credentials;
                    }
                    props.put("spring.datasource.url", "jdbc:postgresql://" + hostAndDb);
                } else {
                    props.put("spring.datasource.url", "jdbc:postgresql://" + schemeRemoved);
                }
            }

            if (username != null) props.put("spring.datasource.username", username);
            if (password != null) props.put("spring.datasource.password", password);

            if (!props.isEmpty()) {
                environment.getPropertySources().addFirst(
                    new MapPropertySource("databaseUrlConverter", props));
            }
        } catch (Exception e) {
            // Fail gracefully — let Spring Boot try with the raw URL
        }
    }
}
