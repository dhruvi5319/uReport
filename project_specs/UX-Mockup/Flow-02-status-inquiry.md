# Flow-02: Caller Status Inquiry — Instant Case Lookup

**Trigger:** Caller gives Marcus a name and street; Marcus needs to find the case in <30 seconds
**User Stories:** US-3.1, US-3.2, US-3.3, US-11.1, US-11.2, US-11.3
**Journey:** JRN-01.2 — Caller Status Inquiry
**Success Metric:** Case located within 30 seconds including one filter application

---

## Flow Diagram

```
[Caller asks for status on "Maria Santos / Elm Avenue"]
        │
        ▼
[Marcus moves focus to Case List search bar]
        │
        ▼
[Types "Maria Santos" — 300 ms debounce fires]
        │
        ▼
[Results appear inline — reporter name highlighted]
  ┌─────────────────────────────┐
  │  3 results found            │
  │  [Mark: Maria Santos] ...   │
  └─────────────────────────────┘
        │
        ▼
[Marcus adds address filter chip "Elm Ave"]
  from filter panel or URL bar
        │
        ▼
[Results narrow to 1 — correct case visible]
  Status badge: OPEN (blue pill)
  Category: Streetlight
        │
        ▼
[Marcus clicks the row → /cases/{id}]
        │
        ▼
[Case Detail: split-pane, timeline always visible]
        │
        ▼
[Marcus reads timeline top entry to caller:
 "Scheduled for repair week of July 14"]
```

---

## Steps

1. **Global search bar** (in top navbar) is always visible and focused on Cmd+K / Ctrl+K shortcut. Marcus does not need to navigate to the case list first.
2. **Debounced live search**: Results update after 300 ms. Minimum 1 character triggers search. Matched text (`<mark>`) highlighted in reporter name and description columns.
3. **Filter combination**: Address filter added via filter panel without clearing the search term. Both conditions applied simultaneously (AND semantics). Filter chip "Address: Elm Ave" appears above the table.
4. **Row identification**: Color-coded status badge (OPEN = blue pill) and category name visible in the row without opening the case. Overdue badge shown in red if applicable.
5. **Case Detail**: Split-pane with timeline immediately visible on right. No secondary navigation needed. Most recent action entry at the top.
6. **Back navigation**: Breadcrumb "← Cases" returns to case list with all filters preserved (URL-encoded state).

---

## Exit Points

| Outcome | Destination |
|---|---|
| Case found + opened | `/cases/{id}` |
| No results | Empty state on `/cases` with "No cases match your filters" |
| User returns to list | `/cases` with filters preserved |

---

*End of Flow-02-status-inquiry.md*
