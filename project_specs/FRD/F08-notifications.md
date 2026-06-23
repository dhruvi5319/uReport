---

## F08: Notification System

**Description:** uReport sends transactional email notifications to all relevant parties when tickets are created, assigned, updated, or responded to. Staff can receive digest-style summary emails. All email sending uses SMTP configured via site config. Notification templates (see F13) are used for message body content, with template variable substitution.

**Terminology:**
- **Transactional Notification:** A single-event email triggered by a ticket mutation (e.g., "new ticket assigned to you").
- **Digest Email:** A scheduled summary email listing open/new tickets for a department.
- **Notification Log:** A record that a specific notification was sent for a ticket, to prevent duplicates.
- **CC Recipients:** Staff members explicitly added as watchers on a ticket who receive update emails.
- **SMTP Config:** Server address, port, credentials, TLS settings — stored in `site_config.php` constants.

**Sub-features:**
- Send confirmation email to reporter on ticket creation
- Send assignment notification to new assignee
- Send update notification to reporter when staff posts a response
- Send CC notifications to staff watchers on ticket updates
- Send digest emails to department staff (configurable frequency)
- Prevent duplicate notification sends
- SMTP configuration via site config
- Template variable substitution in email bodies (see F13)

---

### F08 Process: Ticket Creation Notification

1. Ticket is created (F00 step 9).
2. System checks: does the ticket have a reporter email (`reporterEmail` or `contactMethods`)?
3. If yes, system composes email using the "ticket_created" template.
4. System substitutes template variables: `{{ticket_id}}`, `{{title}}`, `{{category}}`, `{{status}}`, `{{ticket_url}}`.
5. System sends email via SMTP.
6. System logs notification in `ticketHistory` or notification log table (prevents resend).

### F08 Process: Assignment Notification

1. Ticket assignment is updated (F00 process: Assign Ticket, step 5).
2. System fetches new assignee's primary email from `contactMethods`.
3. System composes email using "ticket_assigned" template.
4. System substitutes variables: `{{ticket_id}}`, `{{title}}`, `{{assignee_name}}`, `{{reporter}}`, `{{ticket_url}}`.
5. System sends email.
6. System logs notification.

### F08 Process: Response Notification

1. Staff posts a response (action type `response`, visibility `external`).
2. System fetches reporter's email.
3. System composes email using "ticket_response" template; body includes the response text.
4. System sends email to reporter.
5. System logs notification.

### F08 Process: Digest Email

1. A scheduled job (cron / queue worker) runs at configured frequency (default: daily at 7am).
2. For each department, system queries tickets open > 0 days in that department.
3. System groups by assignee; composes digest email with ticket list.
4. System sends digest to all active staff in the department.
5. No individual notification log entry per ticket — digest is a summary.

---

### F08 Inputs

**Email composition parameters (internal):**
- `to` (string): Recipient email address
- `templateSlug` (string): Which template to use (e.g., `ticket_created`, `ticket_assigned`, `ticket_response`)
- `variables` (object): Key-value map for template variable substitution
- `ticketId` (integer): For notification deduplication logging

**SMTP config (site_config.php constants):**
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_TLS` (bool), `SMTP_FROM_ADDRESS`, `SMTP_FROM_NAME`

---

### F08 Outputs

- Email delivered to recipient(s) via SMTP
- Notification log entry created (prevents duplicate sends)
- No synchronous API output — notifications are fire-and-forget (async preferred)

---

### F08 Validation

- Recipient email must be valid RFC 5322 format
- Template slug must reference an existing template (see F13)
- Notification not sent if identical notification was sent within the last 60 seconds (dedup window)
- If SMTP fails, system logs error to Graylog and does not retry indefinitely (max 3 retries with exponential backoff)
- No notification is sent for tickets in staff-only categories to public/anonymous reporters
- Digest email only sent if there are ≥ 1 open tickets for the recipient's department

---

### F08 Error States

| Scenario | Handling |
|----------|---------|
| SMTP connection failure | Log error to Graylog; retry up to 3 times; if all fail, mark notification as `failed` in log |
| Invalid recipient email | Skip silently; log to Graylog as a warning |
| Template not found | Log error; use fallback plain-text format |
| Duplicate notification within dedup window | Skip silently |
| Reporter has no email address | Skip notification silently |

> **Note:** Notification failures are non-fatal — the ticket operation proceeds regardless of email delivery success.

---

### F08 API Surface (this feature)

Notifications are internal — no external API endpoints. Configuration is via site config. The following admin-facing API is exposed for digest configuration:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/notifications/settings` | admin | Get notification settings |
| PUT | `/api/notifications/settings` | admin | Update digest frequency and SMTP settings |

---

### F08 Schema Surface (this feature)

No dedicated notifications table in legacy schema — notifications are tracked via `ticketHistory`/`actions` with a `type = 'notification_sent'` record, or via a new `notification_log` table.

**New table: `notification_log`** (if not already present in legacy schema):
- `id`, `ticketId` (FK → tickets), `templateSlug`, `recipientEmail`, `sentAt`, `status` (sent|failed), `attemptCount`

See `Y0b-schema-supporting.md` §notification_log.
