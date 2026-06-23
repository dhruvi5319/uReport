# Personas
# uReport — Municipal CRM Modernization

| Field | Value |
|-------|-------|
| **Product** | uReport Municipal CRM |
| **Version** | 1.0 |
| **Date** | 2026-06-23 |
| **Related PRD** | PRD-uReport.md |
| **Status** | Active |

---

## Persona Summary

| ID | Name | Role | Primary Goal |
|----|------|------|--------------|
| PER-01 | Dana Reyes | Municipal Staff Member (CRM Operator) | Efficiently process constituent service tickets from intake to resolution without switching between tools |
| PER-02 | Marcus Webb | Department Manager / Supervisor | Monitor team workload and SLA compliance in real time; generate reports for city leadership |
| PER-03 | Priya Nair | Constituent / Citizen | Submit a service request quickly and get transparent status updates without needing to call city hall |
| PER-04 | Tomás Eriksson | System Administrator / IT + API Client Developer | Deploy, configure, and extend uReport reliably; integrate external apps via Open311 without guessing the contract |

---

## PER-01: Dana Reyes

**Role & Context:**
Dana is a municipal clerk at a mid-size city public works department, one of six staff members who collectively manage roughly 80–120 open service request tickets at any given time. She works at a shared office workstation for most of her shift, but occasionally checks the ticket queue on a city-issued laptop from a field site. Dana logs in each morning through the city's SSO portal (OIDC), reviews her assigned tickets, processes new inbound requests, and coordinates hand-offs to field crews. She is comfortable with web applications but has no development background and does not interact with APIs directly. She has used the legacy uReport system for two years and knows its quirks — she maintains a personal spreadsheet to track which tickets she responded to this week because the legacy UI gives her no quick status summary.

**Goals:**
- Find and act on her highest-priority open tickets within seconds of logging in, without digging through unfiltered lists (F0, F4)
- Post responses to constituents using pre-written templates rather than retyping the same message body repeatedly (F13)
- Attach photos taken by field crews to the correct ticket from a mobile browser on-site (F7, F15)
- See a complete history of what was done on a ticket before escalating it — without having to ask a colleague (F6)
- Close out resolved tickets in bulk at end of shift without the page refreshing her session out (F0, F11)

**Pain Points:**
- The legacy desktop-only CSS layout breaks on her laptop in the field; she has to pinch-zoom to hit buttons
- No saved searches means she re-enters the same filter combination (department + open + assigned to her) every single session
- Response template selection is buried two levels deep in the legacy form; she often types from scratch to save time
- When a constituent calls about a ticket Dana doesn't own, she has no quick way to pull up that record by constituent name — she has to guess the ticket number

**Technical Expertise:** Intermediate — fluent with web apps, email, and standard productivity tools; not comfortable with command-line, APIs, or developer tooling

**Top Tasks:**
1. Review daily ticket queue filtered by department and assignee, prioritize actions (daily, critical)
2. Post a staff response to a constituent using a response template (daily, high)
3. Update ticket status after a field crew resolves an issue (daily, high)
4. Attach a photo or document file uploaded from the field (weekly, medium)
5. Recall a saved search bookmark to skip re-entering standard filters (daily, medium)

**Success Criteria:**
- Can reach her personal ticket queue in ≤ 2 clicks after login (F4, F12)
- Can compose and send a response using a template in under 60 seconds (F13, F8)
- The full ticket history is readable on a 375px mobile viewport without horizontal scrolling (F6, NFR-05)
- Zero cases per month where she loses session mid-workflow and her form input disappears (F11)

---

## PER-02: Marcus Webb

**Role & Context:**
Marcus is a public works department manager responsible for a team of 12 staff members handling sanitation and infrastructure service requests. He spends the first hour of every workday reviewing ticket volume, checking for SLA breaches, and redistributing workload across his team. He reports weekly to the city director with a summary of ticket counts, resolution rates, and any escalated issues. Marcus did not use the legacy system directly for day-to-day ticket work — he relied on a staff member to run CSV exports and paste numbers into a spreadsheet for his reports. He is technologically proficient (he uses Excel pivot tables fluently) but has no patience for multi-step workflows that require navigating five screens to answer "how many tickets are overdue this week?"

**Goals:**
- Know at a glance which staff members are overloaded and which tickets are approaching or past their SLA deadline (F9, F2)
- Reassign tickets from an overwhelmed staff member to an available one without creating new tickets or contacting IT (F0, F3)
- Generate the weekly activity and SLA compliance report for the city director in under five minutes, without asking a clerk to export a spreadsheet (F9)
- Configure auto-close rules and SLA days for his department's ticket categories when city policy changes, without a developer's help (F2)
- Review the audit trail on escalated tickets to understand the full history before a constituent complaint review (F6)

**Pain Points:**
- Currently, SLA breaches are discovered after the fact when a constituent calls to complain — there is no proactive alert or dashboard
- The legacy reporting module requires him to navigate to a separate page, set date filters manually every time, and wait for a slow full-page reload
- Reassigning a ticket requires finding the staff member's profile, then the ticket, then editing the assignment — three separate page visits with no drag-and-drop or bulk action
- CSV export column order changes between exports, breaking his Excel pivot table formulas every few weeks

**Technical Expertise:** Proficient — comfortable with web dashboards, data exports, and Excel; not a developer; has configured SaaS tools (Salesforce, Zendesk) without IT help

**Top Tasks:**
1. Review department SLA dashboard: count of tickets open past SLA threshold, broken down by category (daily, critical)
2. Reassign tickets to balance team workload (daily, high)
3. Generate and export weekly activity and SLA compliance reports as CSV (weekly, critical)
4. Update SLA days or auto-close rules for a category when policy changes (monthly, medium)
5. Drill into a specific staff member's open ticket list to review their queue (as-needed, medium)

**Success Criteria:**
- SLA breach count is visible on login without navigating away from the main screen (F9, F15)
- Can generate and download a weekly department report in under 5 minutes start-to-finish (F9)
- Bulk ticket reassignment completes without a full-page reload (F0, F15)
- Report CSV column order is stable across exports so his Excel templates don't break (F9)

---

## PER-03: Priya Nair

**Role & Context:**
Priya is a resident of the city who submits service requests 2–3 times per year — a pothole near her home, a burned-out streetlight, a missed garbage pickup. She is not a registered user of the city system and does not have a city employee account. She accesses the submission form from her smartphone browser after finding the link on the city's website. She expects the experience to feel as simple as filling out a contact form: enter the problem, upload a photo, hit submit, and get an email confirmation. She does not know what "Open311" means. If the form is confusing or breaks on her phone, she will abandon it and call the city's non-emergency line instead — adding to phone queue volume.

Priya also wants to check the status of a request she filed two weeks ago without calling city hall. If she can't find her ticket by her email address or the confirmation number in her email, she will give up and assume the city ignored her.

**Goals:**
- Submit a service request with location, photo, and description in under 3 minutes on a mobile browser (F0, F5, F7)
- Receive an email confirmation with a ticket number immediately after submission (F8)
- Look up the status of a previously submitted ticket using her confirmation number or email address without creating an account (F0, F10)
- Know that her report reached the right department and is being worked on — even a status of "assigned" is reassuring (F0, F6)

**Pain Points:**
- The legacy submission form is desktop-only CSS; on a 375px phone screen, the map picker and file upload overlap and are unusable
- No confirmation email in the legacy system for anonymous submissions — she has no record of her ticket number
- Status lookup requires navigating to a non-obvious URL; there is no "check my request" link on the submission confirmation page
- The category dropdown contains internal department jargon ("PW-Infra Tier 2") that means nothing to a citizen trying to report a pothole

**Technical Expertise:** Basic to Intermediate — fluent with smartphones and consumer apps; submits forms online regularly; does not understand government IT systems or APIs

**Top Tasks:**
1. Submit a new service request via mobile web with photo and location (as-needed, critical)
2. Receive and read email confirmation with ticket number (immediately after submission, critical)
3. Check current status of a previously submitted ticket (as-needed, high)
4. View the public ticket list to see if her issue was already reported by a neighbor (as-needed, low)

**Success Criteria:**
- Submission form completes successfully on a 375px iPhone viewport in under 3 minutes with no horizontal scroll (NFR-05, F0)
- Confirmation email arrives within 30 seconds of submission and includes a direct link to the ticket status page (F8)
- Anonymous ticket lookup by email + confirmation number works without requiring account creation (F0, F10)
- Category names on the public form use plain-language labels, not internal department codes (F2, F15)

---

## PER-04: Tomás Eriksson

**Role & Context:**
Tomás wears two hats. As the city's sole IT administrator for uReport, he is responsible for deploying the application to Apache + Linux production servers, managing OIDC provider configuration (the city uses Keycloak), adding new staff users to the system, maintaining department and category configuration, and ensuring the system upgrades without data loss. As the technical lead for a third-party mobile app his team is building — a resident-facing iOS/Android app that submits service requests on behalf of citizens — he also acts as an external Open311 API client developer who must integrate against the Open311 GeoReport v2 endpoint.

In both roles, Tomás is blocked by the same legacy problem: there is no API documentation, so every time he needs to understand the correct field names for an Open311 POST request or the response envelope for a service list, he reads raw PHP source code. He has 6 years of web development experience, is comfortable with Docker, REST APIs, JSON, and SQL, and has contributed to open-source PHP projects before.

**Goals:**
- Deploy uReport to a new city server using Ansible or Docker Compose without reverse-engineering undocumented configuration parameters (F16, NFR-12)
- Manage OIDC provider settings, user accounts, departments, and categories from an admin UI without SSH access (F2, F3, F11)
- Integrate his team's Open311 client app against a fully documented, spec-compliant API without having to read PHP source code (F1, F14)
- Register and manage API keys for his mobile app through a self-service UI, without filing an IT ticket to get a key provisioned (F14)
- Upgrade uReport between versions using provided migration scripts that have been tested against the real schema (NFR-10)

**Pain Points:**
- No OpenAPI/Swagger documentation means every integration requires reading PHP controllers to discover field names, enums, and error formats
- OIDC configuration is done via hardcoded PHP constants in `site_config.php` — a typo takes down authentication for all staff with no error message
- Adding a new staff user requires direct database access or navigating a hidden admin URL that isn't in any documentation
- The Open311 endpoint returns slightly different JSON field structures depending on the category's custom fields — inconsistency that breaks his mobile app's deserializer

**Technical Expertise:** Advanced — experienced web developer and Linux sysadmin; comfortable with REST APIs, Docker, Ansible, SQL, PHP, and TypeScript; contributes to open-source projects

**Top Tasks:**
1. Deploy or upgrade uReport to production using Ansible playbook or Docker Compose (quarterly, critical)
2. Configure OIDC provider settings and test the auth flow via the admin UI (on setup/change, critical)
3. Manage staff user accounts: create, assign roles, deactivate (monthly, high)
4. Register a new API client key for the mobile app and test it against the Open311 endpoint (on setup/change, high)
5. Consult the OpenAPI spec to map Open311 request fields to his mobile app's data model (ongoing, high)

**Success Criteria:**
- Full OpenAPI 3.1 spec is served at `/api/docs` and covers 100% of non-Open311 endpoints (F16)
- Open311 GeoReport v2 endpoints pass the spec compliance test suite with 0 failures after modernization (F1, NFR-09)
- OIDC and SMTP settings are configurable via the admin UI without editing any config files (F11, F15)
- Ansible and Docker Compose deployment paths complete end-to-end with documented runbooks (NFR-12)
- API client keys can be created and revoked from the admin UI in under 2 minutes (F14)

---

## Persona Relationships

| Persona | Interacts With | Nature of Interaction |
|---------|---------------|-----------------------|
| PER-01 Dana (Staff) | PER-02 Marcus (Manager) | Dana's tickets appear in Marcus's SLA dashboard; Marcus reassigns tickets from Dana's queue |
| PER-01 Dana (Staff) | PER-03 Priya (Constituent) | Dana posts responses on Priya's tickets; Priya receives email notifications from Dana's actions |
| PER-02 Marcus (Manager) | PER-04 Tomás (Admin/IT) | Marcus requests new categories or SLA rule changes; Tomás configures them in the admin UI |
| PER-03 Priya (Constituent) | PER-01 Dana (Staff) | Priya submits a ticket (public form or Open311 app); Dana picks it up in her queue |
| PER-03 Priya (Constituent) | PER-04 Tomás (API Dev) | Priya uses Tomás's mobile app to submit a ticket via Open311; she never knows Tomás exists |
| PER-04 Tomás (Admin/IT) | PER-01 Dana (Staff) | Tomás creates and manages Dana's user account, OIDC access, and role assignment |
| PER-04 Tomás (API Dev) | PER-01 Dana (Staff) | Open311 tickets submitted via Tomás's app appear in Dana's queue just like web submissions |

---

## Feature–Persona Matrix

**Key:** P = Primary user (core workflow), S = Secondary user (occasional / indirect), — = Not applicable

| Feature | F-Name | PER-01 Dana (Staff) | PER-02 Marcus (Manager) | PER-03 Priya (Citizen) | PER-04 Tomás (Admin/IT) |
|---------|--------|---------------------|-------------------------|------------------------|-------------------------|
| F0 | Ticket Lifecycle Management | P | P | S | — |
| F1 | Open311 GeoReport v2 API | — | — | S | P |
| F2 | Department & Category Management | — | P | — | P |
| F3 | People & Contact Management | S | P | — | P |
| F4 | Full-Text Search & Filtering | P | P | — | — |
| F5 | Geospatial Features | P | S | P | — |
| F6 | Ticket History & Audit Trail | P | P | S | — |
| F7 | Media Attachments | P | — | P | — |
| F8 | Notification System | S | — | P | — |
| F9 | Reporting & Metrics | — | P | — | S |
| F10 | Role-Based Access Control | S | — | S | P |
| F11 | Authentication (OIDC) | P | P | — | P |
| F12 | Bookmark / Saved Search | P | S | — | — |
| F13 | Response Templates | P | S | — | — |
| F14 | API Client Management | — | — | — | P |
| F15 | Modern React/Next.js SPA Frontend | P | P | P | S |
| F16 | RESTful JSON API Backend | — | — | — | P |
| F17 | Substatus Management | P | P | — | — |
| F18 | Ticket Merging | P | S | — | — |

---

*Document generated: 2026-06-23*
*Derived from: PRD-uReport.md (Section 2.2, Section 5, Section 7) · .planning/PROJECT.md*
*Feeds into: UserStories-uReport.md · FRD-uReport.md · TechArch-uReport.md*
