package com.ureport.config;

import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

/**
 * DataSource configuration that handles platform-injected DATABASE_URL.
 *
 * The platform injects DATABASE_URL in postgres:// format (not jdbc:postgresql://).
 * This configuration converts the URL to JDBC format if needed.
 */
@Configuration
public class DataSourceConfig {

    /**
     * Converts postgres:// URL to jdbc:postgresql:// for JDBC compatibility.
     */
    public static String toJdbcUrl(String url) {
        if (url == null) return null;
        // postgres://user:pass@host:port/db → jdbc:postgresql://host:port/db
        if (url.startsWith("postgres://")) {
            // Parse: postgres://user:pass@host:port/db
            String withoutScheme = url.substring("postgres://".length());
            int atIdx = withoutScheme.indexOf('@');
            if (atIdx >= 0) {
                String credentials = withoutScheme.substring(0, atIdx);
                String hostAndDb = withoutScheme.substring(atIdx + 1);
                return "jdbc:postgresql://" + hostAndDb;
            }
            return "jdbc:postgresql://" + withoutScheme;
        }
        // postgresql:// → jdbc:postgresql://
        if (url.startsWith("postgresql://")) {
            return "jdbc:" + url;
        }
        return url;
    }
}
