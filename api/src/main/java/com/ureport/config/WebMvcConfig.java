package com.ureport.config;

import com.ureport.filter.FormatFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC configuration: CORS mappings and FormatFilter registration.
 * Note: SecurityConfig owns security filter chain. WebMvcConfig handles only CORS + format filter.
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowedOrigins:http://localhost:3000}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/v1/**")
                .allowedOriginPatterns(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
        // Open311 endpoints allow all origins (public API)
        registry.addMapping("/open311/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "POST", "OPTIONS");
    }

    /**
     * Registers FormatFilter for Open311 and ticket export/map endpoints.
     * Runs at HIGHEST_PRECEDENCE + 10 to run before controller logic.
     */
    @Bean
    public FilterRegistrationBean<FormatFilter> formatFilterRegistration(FormatFilter formatFilter) {
        FilterRegistrationBean<FormatFilter> reg = new FilterRegistrationBean<>(formatFilter);
        reg.addUrlPatterns("/open311/*", "/api/v1/tickets/export", "/api/v1/tickets/map");
        reg.setOrder(Ordered.HIGHEST_PRECEDENCE + 10);
        return reg;
    }
}
