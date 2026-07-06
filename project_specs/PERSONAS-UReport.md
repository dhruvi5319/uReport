# Persona Document — uReport CRM Modernization

| Field | Value |
|---|---|
| **Product** | uReport Civic CRM (311 Service Request Management) |
| **Version** | 1.0 |
| **Date** | 2026-07-06 |
| **Related PRD** | PRD-UReport.md |
| **Status** | Active |

---

## Persona Summary

| ID | Name | Role | Primary Goal |
|---|---|---|---|
| PER-01 | Marcus Rivera | 311 Operator / CRM Staff | Process and resolve incoming service requests efficiently with minimal friction |
| PER-02 | Diane Kowalski | Department Field Supervisor | Receive assigned cases for her department, log resolutions, and track completion |
| PER-03 | Jordan Calloway | System Administrator | Configure and maintain system lookup tables, user accounts, and API client access |
| PER-04 | Priya Nair | Constituent (Citizen Reporter) | Submit a service request quickly and get confirmation that the city received it |

---

## PER-01: Marcus Rivera

**Role Title:** 311 Operator / CRM Staff  
**Environment:** City call center and desk office, dual-monitor desktop workstation, Chrome browser, 6–8 hours/day in uReport

**Role & Context:**  
Marcus is a full-time 311 call center operator at a mid-size municipality. His primary job is to intake service requests — received via phone, walk-in, or the public web form — enter them into the system, assign them to the appropriate department, and follow up until they are resolved. He manages between 30 and 60 cases per day across all categories: potholes, graffiti, abandoned vehicles, broken streetlights, and more. He works at a call center desk with two monitors, keeping the case list open on one screen while entering caller details on the other. Marcus is comfortable with web applications and can navigate complex filtering UIs, but he becomes frustrated by any interaction that requires a full page reload or makes him lose his place in a form. He is the primary internal user of uReport and the person most affected by the usability of case creation, the case list, and the case detail view.

**Goals:**
- Create new cases quickly during live phone calls without waiting for page reloads (F1, F17, F18)
- Locate any case in seconds using live search and multi-column filters without building a query manually (F3, F11)
- Assign cases to the right department and person in one action, with confidence the notification goes out (F1, F9)
- Bulk-close or bulk-reassign a set of duplicate reports without touching each record individually (F1, F3)
- See the full history and current status of a case on a single screen when a caller asks for an update (F4)
- Use the dashboard each morning to understand what is open, overdue, and assigned to him (F5)

**Pain Points (traced to PRD §2):**
- Full-page reloads after every save action interrupt call flow and force him to re-navigate to the record
- No live search or filter feedback means he must submit a form and wait for results before refining
- Inconsistent UI across screens increases cognitive load and the chance of data entry errors
- Application is unusable on mobile, which prevents checking case status when away from his desk
- No bulk operations force repetitive single-record edits on high-volume duplicate cases

**Technical Expertise:** Intermediate — proficient in web apps and complex forms; does not write code; avoids command-line tools; relies entirely on UI affordances

**Top Tasks (ranked by frequency):**
1. Create a new ticket from a phone call (multiple times per hour, critical)
2. Search and filter the case list to find a specific record (hourly, critical)
3. Assign or reassign a case to a department/person with email notification (multiple times per day, high)
4. Log a response or status update on a case (multiple times per day, high)
5. Bulk-close duplicate reports or bulk-reassign a batch of cases (daily, medium)

**Success Criteria:**
- Creates a new case in under 90 seconds while on a live call
- Finds any specific case using search in under 30 seconds
- Performs bulk operations (assign/close) on 10+ cases in a single action without page reload
- Zero missed email notifications on assigned cases
- Can view full case history and status on one screen without navigating away

---

## PER-02: Diane Kowalski

**Role Title:** Department Field Supervisor (e.g., Public Works, Parks & Recreation)  
**Environment:** Department office or hybrid field/desk, laptop + occasional mobile phone, uses uReport selectively to receive assignments and log closures

**Role & Context:**  
Diane is a supervisor in the Public Works department at the same municipality. She does not work at the 311 call center — instead, she receives tickets that have been assigned to her department by 311 operators like Marcus. She checks uReport once or twice a day to see what new cases have been assigned, coordinates with her field crew to get work done, then logs a resolution or closure note when the work is complete. Diane is not a power user; she uses uReport as a task inbox, not as a full-time workspace. She is comfortable with standard web applications but expects the UI to be immediately clear — she should not need training to find her assigned cases and close them. On occasion she is out in the field and wants to check case status or upload a photo of completed work from her phone. The current system's lack of mobile support is a genuine blocker for this workflow.

**Goals:**
- See all cases assigned to her department at a glance without sorting through irrelevant records (F3, F5)
- Close a case and attach a resolution photo from her phone while still at the job site (F1, F4, F10, F19)
- Log a response explaining what was done so the 311 operator and reporter receive the update (F9)
- Understand which of her department's cases are overdue so she can prioritize crew dispatch (F5, F3)

**Pain Points (traced to PRD §2):**
- No responsive mobile layout makes logging a field resolution impossible without returning to the office
- Full-page reloads after closing a record force re-navigation to the filtered department view
- No quick visual signal for overdue cases; requires manual date math in the current list view
- Attaching a photo from a mobile device is unreliable in the existing system due to no mobile optimization

**Technical Expertise:** Basic-to-intermediate — comfortable with everyday web apps (email, forms, report tools); does not configure software; expects intuitive UIs with no instruction needed

**Top Tasks (ranked by frequency):**
1. Review cases assigned to her department and triage priority (once or twice daily, critical)
2. Close a resolved case and log what was done, with optional photo (daily, critical)
3. Check for overdue cases to escalate or reprioritize (daily, high)
4. Upload a photo of completed work from her phone in the field (several times per week, medium)
5. View a specific case's full history to understand what has been communicated to the reporter (as needed, medium)

**Success Criteria:**
- Can see all open cases assigned to her department in under 2 taps/clicks with no extra filtering
- Can close a case and attach a photo from a mobile browser in under 3 minutes
- Zero cases closed without a logged resolution note
- Overdue cases are visually surfaced in her filtered view without manual date calculation

---

## PER-03: Jordan Calloway

**Role Title:** City IT System Administrator  
**Environment:** City IT office, Windows workstation, manages uReport alongside other municipal software; typically in admin panels 1–2 hours per week

**Role & Context:**  
Jordan is a city IT generalist who owns system administration for uReport. His responsibilities cover configuring the lookup tables that define how the system operates — adding new service categories, creating staff accounts, updating department assignments, managing Open311 API client credentials, and managing the list of response templates and substatuses. Jordan works in the admin panels infrequently but critically: when a new category is needed (e.g., "E-Scooter Obstruction"), a new department supervisor is hired, or a new mobile app vendor requests an Open311 API key, Jordan is the person who makes the change. He is technically proficient — he understands REST APIs, can read an OpenAPI spec, and manages Docker Compose deployments — but he is not a full-stack developer. He values clear, documented admin UIs with confirmation dialogs on destructive actions and toast feedback on saves.

**Goals:**
- Add, edit, or deactivate service categories and departments without touching the database directly (F7, F8)
- Create and manage staff user accounts with correct department affiliations and roles (F6)
- Register and issue API keys for new Open311 clients (mobile app vendors, aggregators) (F14, F0)
- Configure response templates and substatus values that 311 operators use system-wide (F13)
- Access OpenAPI documentation to answer integration questions from vendors without reading source code (F20)

**Pain Points (traced to PRD §2):**
- No OpenAPI/Swagger documentation means every vendor integration question requires digging through PHP source code
- Admin UI inconsistency across panels means he must re-learn navigation patterns each time he switches sections
- No confirmation dialogs on delete operations in the legacy system; one wrong click can corrupt lookup data
- Cannot bootstrap a clean test environment from a documented schema — no Flyway migrations mean manual SQL scripts

**Technical Expertise:** Advanced — understands REST APIs, reads OpenAPI specs, manages Docker Compose, can write basic SQL; does not write application code

**Top Tasks (ranked by frequency):**
1. Create or edit a category/category group and assign it to a department (every few weeks, high)
2. Create or edit a staff person record and assign role/department (monthly or when onboarding, high)
3. Register a new Open311 API client and generate/share an API key (occasional, high)
4. Add or update response templates and substatus values for operator use (occasional, medium)
5. Consult OpenAPI documentation to support a third-party integration (as needed, medium)

**Success Criteria:**
- Can create a fully configured new category (group, department, response templates) in under 10 minutes without documentation
- All destructive admin operations require a confirmation dialog before execution
- Can generate and share a new Open311 API key in under 5 minutes
- OpenAPI spec at `/swagger-ui.html` fully documents all endpoints, including Open311, with no manual lookup needed

---

## PER-04: Priya Nair

**Role Title:** Constituent / Citizen Reporter  
**Environment:** Personal smartphone (375 px viewport), home or on the street; interacts with uReport only via the public case submission form; one-time or occasional user

**Role & Context:**  
Priya is a resident of the city. She is not a government employee — she is a member of the public who discovers a pothole on her commute route and wants to report it. She navigates to the city's 311 web portal on her phone, fills out the public case submission form, and expects a confirmation that her report was received. Priya may or may not create an account; she may submit anonymously with just a description and location, or she may provide her email to receive status updates. She is not familiar with the uReport system specifically — she has general smartphone literacy but has no knowledge of what "ticket ID" or "substatus" mean. She expects the submission experience to feel like filling out a well-designed mobile form, not like navigating a government database. Her interaction with uReport ends at the confirmation screen; she does not log in to manage cases.

**Goals:**
- Report a service request in under 5 minutes without creating an account (F2)
- Drop a pin on a map to identify the exact location rather than trying to type an address from memory (F2)
- Upload a photo of the problem directly from her phone camera as evidence (F2, F10)
- Receive a confirmation with a case reference number so she knows the report was submitted (F2)
- Optionally provide her email to receive a status update when the issue is resolved (F2, F9)

**Pain Points (traced to PRD §2):**
- Mobile-unfriendly submission form with tiny touch targets and horizontal scroll creates abandonment
- No map pin-drop forces address entry, which is difficult when standing near an unmarked location
- No photo upload from mobile means she cannot provide photographic evidence in the current system
- No confirmation screen or case ID means she has no proof the report was accepted
- Multi-field single-page forms on mobile are overwhelming and hard to complete while walking

**Technical Expertise:** Basic — uses smartphone apps daily (social media, banking, maps); fills out online forms; no knowledge of web development or government CRM systems

**Top Tasks (ranked by frequency):**
1. Navigate to the public submission form on a mobile browser and complete it (one-time per incident, critical)
2. Drop a map pin on the exact location of the issue (during submission, critical)
3. Upload one or more photos of the problem from phone camera (during submission, high)
4. Enter optional contact information for status updates (during submission, medium)
5. Receive and save the confirmation screen with case ID (end of submission, high)

**Success Criteria:**
- Completes full submission on a 375 px mobile viewport in under 5 minutes without errors
- Successfully drops a map pin without needing to type a precise street address
- Successfully uploads at least one photo from mobile camera roll during submission
- Receives a confirmation screen with a unique case ID after submission
- Can submit anonymously (no account required) — zero friction login gate

---

## Persona Relationships

| Interaction | PER-01 Marcus (311 Op) | PER-02 Diane (Dept Supervisor) | PER-03 Jordan (Admin) | PER-04 Priya (Citizen) |
|---|---|---|---|---|
| **PER-01 Marcus** | — | Assigns cases to Diane's dept; receives her closure updates | Uses categories/templates configured by Jordan | Receives Priya's public submissions; logs follow-up actions |
| **PER-02 Diane** | Receives assignments from Marcus; returns closure notes | — | Uses dept/category structure Jordan configures | Does not interact directly; resolves issues Priya reported |
| **PER-03 Jordan** | Configures lookup data (categories, templates) Marcus uses | Manages Diane's dept record and user account | — | Maintains the public form's category taxonomy Priya sees |
| **PER-04 Priya** | Submits cases that Marcus receives and processes | No direct interaction | No direct interaction | — |

---

## Feature-Persona Matrix

> **Legend:** P = Primary user / main beneficiary · S = Secondary user / indirect beneficiary · — = Not applicable

| Feature | PER-01 Marcus (311 Op) | PER-02 Diane (Dept Supv) | PER-03 Jordan (Admin) | PER-04 Priya (Citizen) |
|---|---|---|---|---|
| **F0** Open311 / GeoReport v2 API | — | — | P | S |
| **F1** Ticket / Case Lifecycle Management | P | P | — | — |
| **F2** Public Case Submission Form | S | — | — | P |
| **F3** Case List with Search, Filter, Sort | P | P | — | — |
| **F4** Case Detail View | P | P | — | — |
| **F5** Dashboard | P | S | — | — |
| **F6** People Management | — | — | P | — |
| **F7** Department Management | — | — | P | — |
| **F8** Category and Category Group Mgmt | — | — | P | — |
| **F9** Action / Response Logging + Email | P | P | — | S |
| **F10** Media / Photo Attachment Upload | P | P | — | P |
| **F11** PostgreSQL Full-Text Search | P | S | — | — |
| **F12** Authentication — LDAP and CAS | P | P | P | — |
| **F13** Admin Panels (Substatus, Templates, etc.) | S | — | P | — |
| **F14** Client / API Key Management | — | — | P | — |
| **F15** Metrics and Reporting | S | S | P | — |
| **F16** Geo-Clustering for Map Views | P | — | — | — |
| **F17** Design System and UI Framework | P | P | P | P |
| **F18** Navigation Shell | P | P | P | — |
| **F19** Accessibility and Responsive Design | P | P | S | P |
| **F20** OpenAPI / Swagger Documentation | — | — | P | — |
| **F21** Database Migration — MySQL to PostgreSQL | — | — | P | — |

---

*PERSONAS-UReport.md — uReport CRM Modernization v1.0 — 2026-07-06*
