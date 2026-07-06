## Epic 14: Client / API Key Management (F14)

External Open311 clients (mobile apps, aggregators) are registered in the system with a name, URL, API key, and contact person. The admin panel manages these records; the API key is validated for Open311 write operations.

---

### US-14.1: Register a New Open311 API Client
**As a** Jordan Calloway (System Administrator), **I want to** create a new Open311 client record and generate an API key, **so that** I can authorize a new mobile app vendor to submit service requests via the API in under 5 minutes.

**Acceptance Criteria:**
- [ ] An admin panel (within `/admin`) lists all registered Open311 clients with name, URL, contact person, and Actions (Edit / Delete)
- [ ] "New Client" button opens a form: client name (required), client URL (optional), contact person (search/select from people), contact method (dropdown)
- [ ] On save: `POST /api/clients` creates the record and auto-generates a UUID API key
- [ ] The generated API key is displayed after creation so it can be copied and shared
- [ ] Toast "Client registered"; list refreshes
- [ ] API key is validated by Spring Security filter for `POST /open311/v2/requests`

**Priority:** P1 | **Feature Ref:** F14

---

### US-14.2: Edit and Delete an Open311 Client Record
**As a** Jordan Calloway (System Administrator), **I want to** edit a client's details or delete a revoked client's record, **so that** decommissioned integrations no longer have valid API access.

**Acceptance Criteria:**
- [ ] Clicking "Edit" on a client row opens the form pre-filled; PUT updates the record; toast "Client updated"
- [ ] API key is displayed (read-only) in the edit form; it does not regenerate on edit unless explicitly requested
- [ ] Clicking "Delete" shows confirmation dialog: "Delete {client name}? This will revoke their API access."
- [ ] On confirm: `DELETE /api/clients/{id}` removes the record; subsequent requests with this API key return HTTP 403
- [ ] Toast "Client deleted"; list refreshes

**Priority:** P1 | **Feature Ref:** F14

---
