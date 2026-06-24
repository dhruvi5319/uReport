package com.ureport.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Enables @Scheduled support for all scheduled tasks.
 */
@Configuration
@EnableScheduling
public class SchedulerConfig {
    // No additional beans required — @EnableScheduling activates all @Scheduled methods
}
