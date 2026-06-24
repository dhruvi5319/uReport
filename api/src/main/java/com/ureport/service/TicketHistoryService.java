package com.ureport.service;

import com.ureport.dto.response.HistoryEntryResponse;
import com.ureport.entity.Action;
import com.ureport.entity.TicketHistory;
import com.ureport.repository.ActionRepository;
import com.ureport.repository.PersonRepository;
import com.ureport.repository.TicketHistoryRepository;
import com.ureport.util.TemplateVariableResolver;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class TicketHistoryService {

    private final TicketHistoryRepository ticketHistoryRepository;
    private final ActionRepository actionRepository;
    private final PersonRepository personRepository;
    private final TemplateVariableResolver templateVariableResolver;

    public TicketHistoryService(TicketHistoryRepository ticketHistoryRepository,
                                ActionRepository actionRepository,
                                PersonRepository personRepository,
                                TemplateVariableResolver templateVariableResolver) {
        this.ticketHistoryRepository = ticketHistoryRepository;
        this.actionRepository = actionRepository;
        this.personRepository = personRepository;
        this.templateVariableResolver = templateVariableResolver;
    }

    /**
     * Appends an immutable history entry.
     * Called by TicketService on every lifecycle event.
     *
     * @param ticketId            required
     * @param actionId            required (seeded IDs: 1=open, 2=assignment, 3=closed,
     *                            4=changeCategory, 5=changeLocation, 7=duplicate, 8=update, 9=comment)
     * @param enteredByPersonId   nullable (null for system/API-submitted entries)
     * @param actionPersonId      nullable (person acted upon, e.g. assignee)
     * @param notes               nullable free text
     * @param data                nullable JSON string
     */
    public TicketHistory append(Long ticketId, Integer actionId, Integer enteredByPersonId,
                                Integer actionPersonId, String notes, String data) {
        TicketHistory history = new TicketHistory();
        history.setTicketId(ticketId);
        history.setActionId(actionId);
        history.setEnteredByPersonId(enteredByPersonId);
        history.setActionPersonId(actionPersonId);
        history.setNotes(notes);
        history.setData(data);
        return ticketHistoryRepository.save(history);
    }

    /**
     * Returns history entries for a ticket with renderedDescription populated.
     * Ordered by enteredDate ASC per FRD F01.
     */
    @Transactional(readOnly = true)
    public List<HistoryEntryResponse> getHistory(Long ticketId) {
        List<TicketHistory> entries = ticketHistoryRepository.findByTicketIdOrderByEnteredDateAsc(ticketId);

        return entries.stream().map(entry -> {
            // Load action for template
            Optional<Action> actionOpt = actionRepository.findById(entry.getActionId());
            String actionName = actionOpt.map(Action::getName).orElse("");
            String template = actionOpt.map(Action::getTemplate).orElse("");

            // Build context map
            Map<String, Object> context = new HashMap<>();

            // Resolve entered-by person name
            String enteredByPersonName = null;
            if (entry.getEnteredByPersonId() != null) {
                enteredByPersonName = personRepository.findById(entry.getEnteredByPersonId())
                        .map(p -> p.getFullName())
                        .orElse("Person #" + entry.getEnteredByPersonId());
            }
            context.put("enteredByPersonName", enteredByPersonName != null ? enteredByPersonName : "");

            // Resolve action person name
            String actionPersonName = null;
            if (entry.getActionPersonId() != null) {
                actionPersonName = personRepository.findById(entry.getActionPersonId())
                        .map(p -> p.getFullName())
                        .orElse("Person #" + entry.getActionPersonId());
            }
            context.put("actionPersonName", actionPersonName != null ? actionPersonName : "");

            // Parse data JSON for original/updated/duplicate tokens
            if (entry.getData() != null && !entry.getData().isBlank()) {
                parseDataJson(entry.getData(), context);
            }

            String renderedDescription = templateVariableResolver.resolve(template, context);

            return new HistoryEntryResponse(
                    entry.getId(),
                    entry.getTicketId(),
                    entry.getEnteredByPersonId(),
                    enteredByPersonName,
                    entry.getActionPersonId(),
                    actionPersonName,
                    entry.getActionId(),
                    actionName,
                    entry.getEnteredDate(),
                    entry.getActionDate(),
                    entry.getNotes(),
                    entry.getData(),
                    renderedDescription
            );
        }).collect(Collectors.toList());
    }

    /**
     * Retrieves a single history entry for a ticket.
     */
    @Transactional(readOnly = true)
    public Optional<HistoryEntryResponse> getHistoryEntry(Long ticketId, Long historyId) {
        return ticketHistoryRepository.findByIdAndTicketId(historyId, ticketId)
                .map(entry -> getHistory(ticketId).stream()
                        .filter(r -> r.id().equals(historyId))
                        .findFirst()
                        .orElse(null));
    }

    /**
     * Parses a simple JSON object into context map entries with prefix.field keys.
     * Handles: {"original":{"field":val},"updated":{"field":val},"duplicate":{"ticket_id":123}}
     */
    private void parseDataJson(String dataJson, Map<String, Object> context) {
        try {
            // Simple recursive key extraction using basic string parsing
            // For a full JSON library, would use ObjectMapper; here we use a lightweight approach
            // that handles the expected structure from TicketService
            String json = dataJson.trim();
            if (!json.startsWith("{")) return;

            // Extract top-level prefix objects
            for (String prefix : new String[]{"original", "updated", "duplicate"}) {
                String key = "\"" + prefix + "\":";
                int keyIdx = json.indexOf(key);
                if (keyIdx < 0) continue;
                int objStart = json.indexOf("{", keyIdx + key.length());
                if (objStart < 0) continue;
                int objEnd = findMatchingBrace(json, objStart);
                if (objEnd < 0) continue;
                String innerJson = json.substring(objStart + 1, objEnd).trim();
                // Parse key:value pairs within the inner object
                parseSimpleKeyValues(innerJson, prefix, context);
            }
        } catch (Exception e) {
            // Swallow parsing errors — template tokens will be left as-is
        }
    }

    private int findMatchingBrace(String s, int openIdx) {
        int depth = 0;
        for (int i = openIdx; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '{') depth++;
            else if (c == '}') {
                depth--;
                if (depth == 0) return i;
            }
        }
        return -1;
    }

    private void parseSimpleKeyValues(String inner, String prefix, Map<String, Object> context) {
        // Handles: "field": value  or  "field": "value"
        // Simple regex-free parsing for expected structure
        String[] parts = inner.split(",");
        for (String part : parts) {
            int colonIdx = part.indexOf(':');
            if (colonIdx < 0) continue;
            String rawKey = part.substring(0, colonIdx).trim().replaceAll("\"", "");
            String rawValue = part.substring(colonIdx + 1).trim().replaceAll("\"", "");
            if (!rawKey.isBlank() && !rawValue.isBlank()) {
                context.put(prefix + "." + rawKey, rawValue);
            }
        }
    }
}
