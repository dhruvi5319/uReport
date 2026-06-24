package com.ureport.service;

import com.ureport.dto.response.Open311PostResponse;
import com.ureport.dto.response.Open311RequestResponse;
import com.ureport.dto.response.Open311ServiceAttributeResponse;
import com.ureport.dto.response.Open311ServiceResponse;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Manual StringBuilder-based GeoReport v2 XML serializer.
 * Does NOT use JAXB. Produces byte-compatible XML matching the legacy PHP output.
 */
@Service
public class Open311XmlSerializer {

    private static final String XML_DECLARATION = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n";

    /**
     * Serializes a list of Open311ServiceResponse objects to GeoReport v2 XML.
     */
    public String serializeServices(List<Open311ServiceResponse> services) {
        StringBuilder sb = new StringBuilder(XML_DECLARATION);
        sb.append("<services>\n");
        for (Open311ServiceResponse s : services) {
            sb.append("  <service>\n");
            appendElement(sb, "    ", "service_code", s.getServiceCode());
            appendElement(sb, "    ", "service_name", s.getServiceName());
            appendElement(sb, "    ", "description", s.getDescription());
            appendElement(sb, "    ", "metadata", s.getMetadata());
            appendElement(sb, "    ", "type", s.getType());
            appendElement(sb, "    ", "keywords", s.getKeywords());
            appendElement(sb, "    ", "group", s.getGroup());
            if (s.getAttributes() != null && !s.getAttributes().isEmpty()) {
                sb.append("    <attributes>\n");
                for (Open311ServiceAttributeResponse attr : s.getAttributes()) {
                    sb.append("      <attribute>\n");
                    appendElement(sb, "        ", "variable", String.valueOf(attr.isVariable()));
                    appendElement(sb, "        ", "code", attr.getCode());
                    appendElement(sb, "        ", "datatype", attr.getDatatype());
                    appendElement(sb, "        ", "required", String.valueOf(attr.isRequired()));
                    appendElement(sb, "        ", "description", attr.getDescription());
                    appendElement(sb, "        ", "order", String.valueOf(attr.getOrder()));
                    if (attr.getValues() != null && !attr.getValues().isEmpty()) {
                        sb.append("        <values>\n");
                        for (Map<String, String> val : attr.getValues()) {
                            sb.append("          <value>");
                            sb.append("<key>").append(escapeXml(val.get("key"))).append("</key>");
                            sb.append("<name>").append(escapeXml(val.get("name"))).append("</name>");
                            sb.append("</value>\n");
                        }
                        sb.append("        </values>\n");
                    }
                    sb.append("      </attribute>\n");
                }
                sb.append("    </attributes>\n");
            }
            sb.append("  </service>\n");
        }
        sb.append("</services>");
        return sb.toString();
    }

    /**
     * Serializes a list of Open311RequestResponse objects to GeoReport v2 XML.
     */
    public String serializeRequests(List<Open311RequestResponse> requests) {
        StringBuilder sb = new StringBuilder(XML_DECLARATION);
        sb.append("<service_requests>\n");
        for (Open311RequestResponse r : requests) {
            sb.append("  <request>\n");
            appendElement(sb, "    ", "service_request_id", r.getServiceRequestId());
            appendElement(sb, "    ", "status", r.getStatus());
            appendElement(sb, "    ", "status_notes", r.getStatusNotes());
            appendElement(sb, "    ", "service_name", r.getServiceName());
            appendElement(sb, "    ", "service_code", r.getServiceCode());
            appendElement(sb, "    ", "description", r.getDescription());
            appendElement(sb, "    ", "agency_responsible", r.getAgencyResponsible());
            appendElement(sb, "    ", "requested_datetime", r.getRequestedDatetime());
            appendElement(sb, "    ", "updated_datetime", r.getUpdatedDatetime());
            appendElement(sb, "    ", "expected_datetime", r.getExpectedDatetime());
            appendElement(sb, "    ", "lat", r.getLat());
            appendElement(sb, "    ", "long", r.getLng());
            appendElement(sb, "    ", "address", r.getAddress());
            appendElement(sb, "    ", "address_id", r.getAddressId());
            appendElement(sb, "    ", "zipcode", r.getZipcode());
            appendElement(sb, "    ", "media_url", r.getMediaUrl());
            sb.append("  </request>\n");
        }
        sb.append("</service_requests>");
        return sb.toString();
    }

    /**
     * Serializes discovery metadata to GeoReport v2 XML.
     */
    @SuppressWarnings("unchecked")
    public String serializeDiscovery(Map<String, Object> discoveryData) {
        StringBuilder sb = new StringBuilder(XML_DECLARATION);
        sb.append("<discovery>\n");
        appendElement(sb, "  ", "changeset", stringify(discoveryData.get("changeset")));
        appendElement(sb, "  ", "contact", stringify(discoveryData.get("contact")));
        appendElement(sb, "  ", "key_service", stringify(discoveryData.get("key_service")));

        Object endpointsObj = discoveryData.get("endpoints");
        if (endpointsObj instanceof List<?> endpoints) {
            sb.append("  <endpoints>\n");
            for (Object ep : endpoints) {
                if (ep instanceof Map<?, ?> endpoint) {
                    sb.append("    <endpoint>\n");
                    appendElement(sb, "      ", "specification", stringify(endpoint.get("specification")));
                    appendElement(sb, "      ", "url", stringify(endpoint.get("url")));
                    appendElement(sb, "      ", "changeset", stringify(endpoint.get("changeset")));
                    appendElement(sb, "      ", "type", stringify(endpoint.get("type")));
                    Object formatsObj = endpoint.get("formats");
                    if (formatsObj instanceof List<?> formats) {
                        sb.append("      <formats>\n");
                        for (Object fmt : formats) {
                            sb.append("        <format>").append(escapeXml(stringify(fmt))).append("</format>\n");
                        }
                        sb.append("      </formats>\n");
                    }
                    sb.append("    </endpoint>\n");
                }
            }
            sb.append("  </endpoints>\n");
        }
        sb.append("</discovery>");
        return sb.toString();
    }

    /**
     * Serializes a POST /open311/requests response to GeoReport v2 XML.
     */
    public String serializePostResponse(Open311PostResponse r) {
        StringBuilder sb = new StringBuilder(XML_DECLARATION);
        sb.append("<service_requests>\n");
        sb.append("  <request>\n");
        appendElement(sb, "    ", "service_request_id", r.getServiceRequestId());
        appendElement(sb, "    ", "service_notice", r.getServiceNotice());
        appendElement(sb, "    ", "account_id", r.getAccountId());
        sb.append("  </request>\n");
        sb.append("</service_requests>");
        return sb.toString();
    }

    /**
     * Appends an XML element, skipping null values.
     */
    private void appendElement(StringBuilder sb, String indent, String tag, String value) {
        if (value == null) {
            // Omit null-valued elements per spec
            return;
        }
        sb.append(indent).append("<").append(tag).append(">")
                .append(escapeXml(value))
                .append("</").append(tag).append(">\n");
    }

    /**
     * Escapes XML special characters in text content.
     */
    public static String escapeXml(String input) {
        if (input == null) return "";
        return input
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }

    private String stringify(Object obj) {
        return obj != null ? String.valueOf(obj) : null;
    }
}
