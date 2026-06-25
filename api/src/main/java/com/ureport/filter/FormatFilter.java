package com.ureport.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * OncePerRequestFilter that reads the ?format= query parameter and:
 * 1. Sets the "responseFormat" request attribute for controllers to consume.
 * 2. Pre-sets the response Content-Type for xml, csv, and print formats.
 *
 * Registered for /open311/*, /api/v1/tickets/export, /api/v1/tickets/map
 * via WebMvcConfig.formatFilterRegistration.
 */
@Component
public class FormatFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws IOException, ServletException {
        String format = request.getParameter("format");
        if (format != null) {
            request.setAttribute("responseFormat", format);
            switch (format) {
                case "xml"   -> response.setContentType("application/xml; charset=utf-8");
                case "csv"   -> response.setContentType("text/csv; charset=utf-8");
                case "print" -> response.setContentType("text/html; charset=utf-8");
                case "json"  -> {}   // Jackson default — do nothing
                default      -> {}   // invalid format rejected by controllers
            }
        }
        chain.doFilter(request, response);
    }
}
