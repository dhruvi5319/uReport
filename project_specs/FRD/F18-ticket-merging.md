---

## F18: Ticket Merging

**Description:** When constituents report the same issue multiple times (e.g., the same pothole reported by five different residents), staff can merge the duplicate source tickets into a single canonical target ticket. The merged source tickets are closed and linked to the canonical ticket. Reporters of merged tickets are notified with the canonical ticket ID.

**Terminology:**
- **Source Ticket:** The duplicate ticket being merged away. It will be closed and linked to the target.
- **Target Ticket:** The canonical ticket that represents the issue. It remains open and receives the merge reference.
- **Merge Action:** An `actions` entry of type `merged` on both source and target tickets recording the merge event.

**Sub-features:**
- Search for a target ticket to merge the current source ticket into
- Preview both tickets before confirming the merge
- Execute the merge: close source, link to target, record audit trail entries
- Notify the reporter of the source (merged) ticket with the target ticket ID
- Display merged references in the target ticket's history
- Flag merged/closed source tickets in search results

---

### F18 Process: Execute Merge

1. Staff is viewing the source ticket and selects "Merge into another ticket".
2. Staff searches for and selects a target ticket (any open ticket, different from source).
3. System displays a merge preview: both ticket summaries side-by-side.
4. Staff confirms the merge.
5. System validates: source ≠ target; source not already merged; target is not merged/closed.
6. System sets `source.status = 'closed'`, `source.mergedIntoTicketId = target.id`, `source.datetimeClosed = NOW()`.
7. System creates an `actions` entry on the source ticket: `type = 'merged'`, `payload.mergedIntoTicketId = target.id`.
8. System creates an `actions` entry on the target ticket: `type = 'merged'`, `payload.mergedFromTicketId = source.id`.
9. System sends email to the source ticket's reporter (if email available) with the target ticket's URL (see F08).
10. System updates Solr index for both tickets.
11. System returns the updated source ticket with HTTP 200.

---

### F18 Inputs

**Merge request:**
- `targetTicketId` (integer, required): The ID of the canonical ticket to merge into

---

### F18 Outputs

- Source ticket updated: `status = 'closed'`, `mergedIntoTicketId` set
- Two `actions` records created (one on each ticket)
- Email notification sent to source reporter
- Both tickets updated in Solr

**Merge response:**
```json
{
  "data": {
    "sourceTicketId": 98,
    "targetTicketId": 101,
    "status": "merged",
    "mergedAt": "2026-06-23T15:00:00Z"
  },
  "meta": {},
  "errors": []
}
```

---

### F18 Validation

- `targetTicketId` must be different from the source ticket ID
- Source ticket must not already be merged (i.e., `mergedIntoTicketId` is null)
- Target ticket must be `status = 'open'` and not itself a merged ticket
- Caller must have `staff` or `admin` role
- Both tickets must exist and not be deleted

---

### F18 Error States

| Scenario | HTTP | Error Code | Message |
|----------|------|------------|---------|
| Source = target | 422 | SELF_MERGE | "Cannot merge a ticket into itself" |
| Source already merged | 409 | ALREADY_MERGED | "This ticket has already been merged" |
| Target is closed | 409 | TARGET_CLOSED | "Cannot merge into a closed ticket" |
| Target is itself merged | 409 | TARGET_MERGED | "Cannot merge into a ticket that has already been merged" |
| Target ticket not found | 404 | NOT_FOUND | "Target ticket not found" |
| Caller not staff | 403 | FORBIDDEN | "Staff or admin role required to merge tickets" |

---

### F18 API Surface (this feature)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/tickets/{id}/merge` | staff/admin | Merge source ticket into target |
| GET | `/api/tickets/{id}/merge-candidates` | staff/admin | Search for valid merge target tickets |

---

### F18 Schema Surface (this feature)

Adds one column to `tickets`: `mergedIntoTicketId` (FK → tickets, nullable — self-referential).

Uses `actions` table for merge audit trail entries (type = `merged`). See `Y0a-schema-core.md` §tickets.
