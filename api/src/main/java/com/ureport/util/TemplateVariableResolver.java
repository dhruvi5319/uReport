package com.ureport.util;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class TemplateVariableResolver {

    // Pattern for {prefix:field} tokens like {original:category_id}, {updated:location}, {duplicate:ticket_id}
    private static final Pattern DATA_TOKEN_PATTERN = Pattern.compile("\\{(original|updated|duplicate):([^}]+)\\}");

    // Pattern for simple tokens like {enteredByPerson}, {actionPerson}, {reportedByPerson_id}
    private static final Pattern SIMPLE_TOKEN_PATTERN = Pattern.compile("\\{(enteredByPerson|actionPerson|reportedByPerson_id)\\}");

    /**
     * Resolves template variables in the given template string using the provided context.
     *
     * Supported tokens (per FRD F01):
     *   {enteredByPerson}       → context.get("enteredByPersonName") (full name String)
     *   {actionPerson}          → context.get("actionPersonName")
     *   {reportedByPerson_id}   → context.get("reportedByPersonName")
     *   {original:field}        → context.get("original.field") from data JSON
     *   {updated:field}         → context.get("updated.field") from data JSON
     *   {duplicate:ticket_id}   → context.get("duplicate.ticket_id") from data JSON
     *
     * Unknown tokens are left as-is (per FRD F01 rule: "Unknown variable tokens are left as-is").
     */
    public String resolve(String template, Map<String, Object> context) {
        if (template == null) return "";
        if (context == null || context.isEmpty()) return template;

        String result = template;

        // Replace simple person tokens
        result = replaceSimpleToken(result, "enteredByPerson", "enteredByPersonName", context);
        result = replaceSimpleToken(result, "actionPerson", "actionPersonName", context);
        result = replaceSimpleToken(result, "reportedByPerson_id", "reportedByPersonName", context);

        // Replace data tokens: {original:field}, {updated:field}, {duplicate:ticket_id}
        result = replaceDataTokens(result, context);

        return result;
    }

    /**
     * Replaces a simple {token} with the value from context using the given context key.
     * Leaves the token unchanged if context key not found.
     */
    private String replaceSimpleToken(String text, String token, String contextKey, Map<String, Object> context) {
        if (!text.contains("{" + token + "}")) return text;
        Object value = context.get(contextKey);
        if (value == null) return text; // leave unknown tokens as-is
        return text.replace("{" + token + "}", String.valueOf(value));
    }

    /**
     * Replaces {prefix:field} data tokens from context map entries like "original.field", "updated.field",
     * or "duplicate.ticket_id".
     */
    private String replaceDataTokens(String text, Map<String, Object> context) {
        Matcher matcher = DATA_TOKEN_PATTERN.matcher(text);
        StringBuffer sb = new StringBuffer();
        while (matcher.find()) {
            String prefix = matcher.group(1);   // original, updated, or duplicate
            String field = matcher.group(2);    // e.g. category_id, location, ticket_id
            String contextKey = prefix + "." + field;
            Object value = context.get(contextKey);
            if (value != null) {
                matcher.appendReplacement(sb, Matcher.quoteReplacement(String.valueOf(value)));
            } else {
                // Leave unknown tokens as-is
                matcher.appendReplacement(sb, Matcher.quoteReplacement(matcher.group(0)));
            }
        }
        matcher.appendTail(sb);
        return sb.toString();
    }
}
