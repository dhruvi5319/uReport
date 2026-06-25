package com.ureport.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class MediaConfig {

    /**
     * Returns the media storage root path from the APP_MEDIA_PATH environment variable.
     * Defaults to /app/media if not set.
     */
    @Bean
    public Path mediaPath() {
        String envPath = System.getenv("APP_MEDIA_PATH");
        if (envPath == null || envPath.isBlank()) {
            envPath = "/app/media";
        }
        return Paths.get(envPath);
    }
}
