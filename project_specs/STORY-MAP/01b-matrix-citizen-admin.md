---

## Story Map Matrix — Part B: Citizen & Admin Journeys

### Journey Key

| Code | Journey | Persona |
|------|---------|---------|
| JRN-03.1 | Mobile Service Request Submission & Status Tracking | PER-03 Priya (Citizen) |
| JRN-04.1 | New Server Deployment, OIDC Config, Open311 API Test | PER-04 Tomás (Admin/IT) |
| JRN-04.2 | Operational Admin: Register API Key, Provision Staff User | PER-04 Tomás (Admin/IT) |

### JRN-03.1: Mobile Service Request Submission & Status Tracking (PER-03 Priya)

Stages: **Discover Form → Select Category → Enter Location → Upload Photo → Submit Form → Receive Email & Check Status**

| SM-ID | Stage | Epic | Story ID | Story Title | NaC | Release |
|-------|-------|------|----------|-------------|-----|---------|
| SM-15.2-cit | Discover Form | F15 SPA | US-15.2 | Submit a Service Request via the Citizen Portal on Mobile | JTBD-03.1: Public `/submit` form loads on 375px iPhone with no horizontal scroll; no overlapping controls | R1 |
| SM-15.3-cit | Discover Form | F15 SPA | US-15.3 | Meet WCAG 2.1 AA Accessibility Requirements | JTBD-03.1: All form inputs have labels; interactive elements keyboard-navigable; WCAG 2.1 AA passes | R1 |
| SM-10.2 | Discover Form | F10 RBAC | US-10.2 | Restrict Ticket Visibility by Category Display Permission | JTBD-03.2: Anonymous users see only public-category tickets; staff-only categories hidden from citizen view | R1 |
| SM-2.1-cat | Select Category | F2 Category | US-2.1 | Create and Configure a Service Category | JTBD-03.1: Plain-language category labels ("Pothole or Road Damage") configured by admin; no internal jargon visible to citizens | R1 |
| SM-10.1 | Select Category | F10 RBAC | US-10.1 | Enforce Role-Based Permissions on All API Endpoints | JTBD-03.2: Anonymous submission only allowed for `postingPermission = anonymous` categories; HTTP 403 otherwise | R1 |
| SM-5.1-cit | Enter Location | F5 Geo | US-5.1 | Submit a Ticket with Location Using a Map Picker | JTBD-03.1: Map picker + address geocoding fully usable on 375px mobile; pin confirms correct location | R2 |
| SM-7.1 | Upload Photo | F7 Media | US-7.1 | Upload a Photo to a Ticket from a Mobile Browser | JTBD-01.3: File upload control fully visible and operable on 375px; thumbnail preview appears after JPEG/PNG selection | R2 |
| SM-7.2 | Upload Photo | F7 Media | US-7.2 | View and Download Ticket Attachments | JTBD-03.1: Image thumbnails display inline in ticket detail; download links accessible to permitted callers | R2 |
| SM-0.1-cit | Submit Form | F0 Lifecycle | US-0.1 | Create a Ticket as a Staff Member | JTBD-03.1: Ticket creation via public form returns 201 with ticket ID; confirmation page shows ticket number | R1 |
| SM-8.1 | Submit Form | F8 Notify | US-8.1 | Receive Email Confirmation After Submitting a Request | JTBD-03.1: Confirmation email with ticket ID and `/track/{id}` link arrives within 30 seconds of submission | R2 |
| SM-0.2-pub | Receive Email & Check Status | F0 Lifecycle | US-0.2 | View Ticket Detail with Full History | JTBD-03.2: Public ticket status page shows current status, last-updated timestamp, and assigned department without login | R1 |
| SM-6.1-pub | Receive Email & Check Status | F6 Audit | US-6.1 | View the Complete Audit Trail for a Ticket | JTBD-03.2: Public-visible audit actions shown on status page; internal comments excluded for anonymous callers | R1 |

### JRN-04.1: New Server Deployment, OIDC Config & Open311 API Test (PER-04 Tomás)

Stages: **Read Runbook → Docker Compose Up → Configure OIDC in Admin UI → Test Staff Login → Read OpenAPI Spec → Run Open311 Compliance Test**

| SM-ID | Stage | Epic | Story ID | Story Title | NaC | Release |
|-------|-------|------|----------|-------------|-----|---------|
| SM-16.3 | Read Runbook | F16 API Backend | US-16.3 | Access Data via a Clean Repository Pattern (Developer) | JTBD-04.2: Repository pattern and security headers documented; no raw SQL in controllers; mockable in unit tests | R1 |
| SM-16.1 | Docker Compose Up | F16 API Backend | US-16.1 | Consume a Consistent JSON API from the SPA | JTBD-04.2: All `/api/` responses use `{data, meta, errors}` envelope with correct HTTP codes; deployed via Docker Compose | R1 |
| SM-15.4 | Configure OIDC in Admin UI | F15 SPA | US-15.4 | Access Admin Configuration Screens in the SPA | JTBD-04.3: OIDC and SMTP configurable from admin UI without editing config files; all admin CRUD available in SPA | R1 |
| SM-11.1-cfg | Test Staff Login | F11 Auth | US-11.1 | Log In via OIDC SSO | JTBD-04.2: OIDC round-trip completes with role resolved from `people.role`; clear error on provider unreachable | R1 |
| SM-11.2-cfg | Test Staff Login | F11 Auth | US-11.2 | Maintain Secure Session Across the Workday | JTBD-04.2: OIDC config (`OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`) configurable via admin UI; no source file edits | R1 |
| SM-16.2 | Read OpenAPI Spec | F16 API Backend | US-16.2 | Access Complete OpenAPI Documentation for All Endpoints | JTBD-04.1: `/api/docs` serves Swagger UI; `/api/openapi.json` covers 100% of non-Open311 endpoints with field descriptions | R1 |
| SM-1.3 | Read OpenAPI Spec | F1 Open311 | US-1.3 | Discover Available Open311 Services | JTBD-04.1: `GET /open311/services` and `/open311/discovery` return all active public categories; JSON + XML supported | R1 |
| SM-1.1 | Run Open311 Compliance Test | F1 Open311 | US-1.1 | Submit a Service Request via Open311 | JTBD-04.1: `POST /open311/requests` accepts GeoReport v2 fields; returns service_request_id; custom_attributes stored consistently | R1 |
| SM-1.2 | Run Open311 Compliance Test | F1 Open311 | US-1.2 | Query Service Requests via Open311 | JTBD-04.1: Open311 GeoReport v2 compliance test suite reports 0 failures across all required endpoints and response formats | R1 |

### JRN-04.2: Operational Admin — Register API Key & Provision Staff User (PER-04 Tomás)

Stages: **Navigate to API Client Mgmt → Create New API Client → Test API Key → Navigate to Staff User Mgmt → Assign Role and Save**

| SM-ID | Stage | Epic | Story ID | Story Title | NaC | Release |
|-------|-------|------|----------|-------------|-----|---------|
| SM-14.1 | Navigate & Create API Client | F14 API Clients | US-14.1 | Register a New API Client and Receive an API Key | JTBD-04.3: API key generated and displayed in admin UI within 30 seconds; copy-to-clipboard button present; no database access | R3 |
| SM-14.2 | Navigate & Revoke Key | F14 API Clients | US-14.2 | Revoke and Regenerate an API Client Key | JTBD-04.3: Revoked key rejected by Open311 endpoint immediately; new key generated via UI in < 2 minutes total | R3 |
| SM-1.1-key | Test API Key | F1 Open311 | US-1.1 | Submit a Service Request via Open311 | JTBD-04.3: New API key accepted by `POST /open311/requests` immediately after provisioning; curl example in admin UI | R1 |
| SM-3.1-usr | Navigate to Staff User Mgmt | F3 People | US-3.1 | Create a Staff User Account | JTBD-04.3: Staff user created from admin nav without SSH; role selector shows human-readable descriptions; department visible before save | R2 |
| SM-10.1-rbac | Assign Role and Save | F10 RBAC | US-10.1 | Enforce Role-Based Permissions on All API Endpoints | JTBD-04.3: Role read from `people.role` on every request; admin role grants full access; staff role scoped to department | R1 |
| SM-4.3 | (Background: Solr sync) | F4 Search | US-4.3 | Keep Solr Index in Sync with Ticket Mutations | JTBD-04.2: Every ticket mutation triggers async Solr index update; failures logged to Graylog; re-index CLI documented | R2 |
| SM-17.1 | (Config: Substatuses) | F17 Substatus | US-17.1 | Create and Configure Substatuses | JTBD-01.1: Admin creates substatus labels ("Scheduled", "Pending Parts"); default substatus auto-applied at ticket open/close | R2 |
| SM-18.1 | (Workflow: Merge) | F18 Merging | US-18.1 | Merge a Duplicate Ticket into a Canonical Record | JTBD-02.1: Staff merges 5 duplicate pothole reports into 1 canonical ticket; merge recorded in audit trail of both tickets | R3 |
| SM-5.2 | (Map: Density view) | F5 Geo | US-5.2 | View Geo-Clustered Ticket Density Map | JTBD-01.1: `GET /api/tickets/clusters` returns geo-clustered density data; map view available alongside list view in staff UI | R2 |

---
