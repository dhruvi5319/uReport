<?php
declare(strict_types=1);
namespace Services;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;
use Repositories\TemplateRepository;
use Repositories\NotificationLogRepository;
use Repositories\PersonRepository;
use Repositories\DepartmentRepository;
use Repositories\TicketRepository;

/**
 * Transactional email dispatch service (FRD F08).
 *
 * Sends emails via PHPMailer SMTP, substituting {{variable}} placeholders from
 * stored templates, deduplicating within a 60-second window, and retrying up to
 * 3 times with exponential backoff. Every send attempt is logged to notification_log.
 *
 * sendDigest() sends per-department daily digest emails to all active staff members.
 */
class NotificationService
{
    public function __construct(
        private readonly TemplateRepository        $templates,
        private readonly NotificationLogRepository $notifLog,
        private readonly PersonRepository          $persons,
        private readonly DepartmentRepository      $departments,
        private readonly TicketRepository          $tickets,
    ) {}

    /**
     * Send a transactional notification email.
     *
     * Non-fatal: logs errors to error_log, never throws.
     *
     * @param string   $templateSlug  One of: ticket_created, ticket_assigned, ticket_response,
     *                                ticket_closed, ticket_merged, digest_daily
     * @param string   $to            Recipient email address
     * @param array    $vars          Template variable substitutions (['ticket_id' => 101, 'title' => '...'])
     * @param int|null $ticketId      For notification_log dedup (null for digest emails)
     */
    public function send(string $templateSlug, string $to, array $vars, ?int $ticketId = null): void
    {
        // 1. Validate recipient email address (non-fatal on invalid — FRD F08 error states)
        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            error_log("[NotificationService] Invalid recipient email skipped: {$to}");
            return;
        }

        // 2. Dedup check: skip if same template+recipient+ticket sent within 60 seconds (FRD F08)
        if ($ticketId !== null && $this->notifLog->hasSentRecently($to, $templateSlug, $ticketId, 60)) {
            return; // Skip duplicate silently
        }

        // 3. Fetch template by slug; fall back to plain notification if missing
        $template = $this->templates->findBySlug($templateSlug);
        if ($template === null) {
            error_log("[NotificationService] Template not found: {$templateSlug} — using fallback body");
        }

        [$subject, $body] = $template
            ? [
                $this->interpolate($template->subject ?? 'Notification', $vars),
                $this->interpolate($template->body, $vars),
            ]
            : [
                'Notification',
                'Please visit ' . (defined('BASE_URL') ? BASE_URL : '') . ' for updates.',
            ];

        // 4–5. Send via PHPMailer with retry (max 3 attempts, exponential backoff)
        $status       = 'failed';
        $errorMessage = null;
        $attempts     = 0;

        for ($attempt = 0; $attempt < 3; $attempt++) {
            $attempts++;
            try {
                $mail = $this->buildMailer();
                $mail->addAddress($to);
                $mail->Subject = $subject;
                $mail->Body    = $body;
                $mail->send();
                $status = 'sent';
                break; // Success — stop retrying
            } catch (PHPMailerException $e) {
                $errorMessage = $e->getMessage();
                if ($attempt < 2) {
                    sleep(2 ** $attempt); // Backoff: 1s then 2s (attempt 0→1s, 1→2s)
                }
            }
        }

        if ($status === 'failed') {
            error_log("[NotificationService] SMTP failed after {$attempts} attempts for {$to}: {$errorMessage}");
        }

        // 6. Log every attempt to notification_log (FRD F08 schema surface)
        $this->notifLog->create([
            'ticketId'       => $ticketId,
            'templateSlug'   => $templateSlug,
            'recipientEmail' => $to,
            'sentAt'         => $status === 'sent' ? (new \DateTimeImmutable())->format('Y-m-d H:i:s') : null,
            'status'         => $status,
            'attemptCount'   => $attempts,
            'errorMessage'   => $errorMessage,
        ]);
    }

    /**
     * Send daily digest to all active staff in a department (FRD F08 Process: Digest Email).
     *
     * Digest is skipped if the department has 0 open tickets (per FRD F08).
     *
     * @param int $departmentId Department to send digest for
     */
    public function sendDigest(int $departmentId): void
    {
        // Verify department is active
        $dept = $this->departments->findById($departmentId);
        if ($dept === null || !$dept->active) {
            return;
        }

        // Fetch open tickets — skip if none (FRD F08: "only sent if ≥ 1 open tickets")
        $openTickets = $this->tickets->findByFilters(['departmentId' => $departmentId, 'status' => 'open'], 1, 500);
        $ticketRows  = $openTickets['rows'] ?? $openTickets;
        if (empty($ticketRows)) {
            return;
        }

        // Fetch all active staff in department
        $staffList = $this->persons->findWithFilters([
            'departmentId' => $departmentId,
            'active'       => true,
        ], 1, 200);
        $staffRows = $staffList['rows'] ?? $staffList;

        // Build digest template variables
        $ticketLines = array_map(
            fn($t) => "  #{$t->id}: {$t->title} (opened {$t->datetimeOpened})",
            $ticketRows
        );

        $vars = [
            'department'  => $dept->name,
            'open_count'  => (string) count($ticketRows),
            'ticket_list' => implode("\n", $ticketLines),
        ];

        // Send to each staff member's primary email
        foreach ($staffRows as $person) {
            $email = $this->getPrimaryEmail($person->id);
            if ($email !== null) {
                $this->send('digest_daily', $email, $vars, null); // null ticketId for digest
            }
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Substitute {{key}} placeholders in template text with $vars values.
     * Unrecognised placeholders are left unchanged (safe default).
     */
    private function interpolate(string $text, array $vars): string
    {
        return preg_replace_callback(
            '/\{\{(\w+)\}\}/',
            fn($m) => $vars[$m[1]] ?? $m[0],
            $text
        );
    }

    /**
     * Build and configure a PHPMailer instance from SMTP_* constants.
     * All constants fall back to sane defaults for local/dev environments.
     */
    private function buildMailer(): PHPMailer
    {
        $mail = new PHPMailer(true); // true = exceptions enabled
        $mail->isSMTP();
        $mail->Host       = defined('SMTP_HOST') ? SMTP_HOST : 'localhost';
        $mail->Port       = defined('SMTP_PORT') ? (int) SMTP_PORT : 1025;
        $mail->SMTPAuth   = defined('SMTP_USER') && SMTP_USER !== '';
        $mail->Username   = defined('SMTP_USER') ? SMTP_USER : '';
        $mail->Password   = defined('SMTP_PASS') ? SMTP_PASS : '';
        $mail->SMTPSecure = (defined('SMTP_TLS') && SMTP_TLS) ? PHPMailer::ENCRYPTION_STARTTLS : '';
        $mail->setFrom(
            defined('SMTP_FROM_ADDRESS') ? SMTP_FROM_ADDRESS : 'noreply@localhost',
            defined('SMTP_FROM_NAME')    ? SMTP_FROM_NAME    : 'uReport'
        );
        $mail->isHTML(false); // Plain text; HTML is a future enhancement
        return $mail;
    }

    /**
     * Retrieve the primary email address for a person via a direct PDO query.
     * Avoids pulling in ContactMethodRepository as a dependency.
     * Returns null if no primary email is configured.
     */
    private function getPrimaryEmail(int $personId): ?string
    {
        $pdo  = \Infrastructure\Database\PdoConnection::get();
        $stmt = $pdo->prepare(
            "SELECT value FROM contactMethods
             WHERE personId = :pid AND type = 'email' AND isPrimary = 1
             LIMIT 1"
        );
        $stmt->execute(['pid' => $personId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? $row['value'] : null;
    }
}
