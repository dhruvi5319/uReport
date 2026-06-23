<?php
declare(strict_types=1);
namespace Console;

use Services\NotificationService;
use Repositories\DepartmentRepository;

/**
 * CLI cron entry point for daily digest email dispatch (FRD F08 Process: Digest Email).
 *
 * Scheduled via cron (TechArch §6.7):
 *   0 7 * * * php /var/www/html/crm/console.php digest
 *
 * Iterates all active departments and calls NotificationService::sendDigest() for each.
 * sendDigest() internally skips departments with 0 open tickets (FRD F08 rule).
 */
class DigestCronCommand
{
    public function __construct(
        private readonly NotificationService  $notifier,
        private readonly DepartmentRepository $departments,
    ) {}

    /**
     * Entry point — iterate active departments and dispatch digest emails.
     *
     * Called by console.php dispatcher: php crm/console.php digest
     */
    public function execute(): void
    {
        $depts = $this->departments->findAll(activeOnly: true);

        if (empty($depts)) {
            echo "[digest] No active departments found. Exiting.\n";
            return;
        }

        foreach ($depts as $dept) {
            echo "[digest] Sending digest for department: {$dept->name} (id={$dept->id})\n";
            try {
                $this->notifier->sendDigest($dept->id);
            } catch (\Throwable $e) {
                // Non-fatal: log and continue with remaining departments
                echo "[digest] ERROR for department {$dept->id}: {$e->getMessage()}\n";
                error_log("[DigestCronCommand] Department {$dept->id} ({$dept->name}) failed: {$e->getMessage()}");
            }
        }

        echo "[digest] Done.\n";
    }
}
