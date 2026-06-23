<?php
declare(strict_types=1);
namespace Controllers\Api;

use Infrastructure\Cache\MetricsCache;
use Infrastructure\Database\PdoConnection;
use Services\SlaService;

/**
 * Reporting endpoints (FRD F09 — Reporting & Metrics).
 *
 * Routes (from TechArch §4.3 Reporting):
 *   GET /api/reports/activity          → ActivityReport shape
 *   GET /api/reports/assignments       → AssignmentReport[]
 *   GET /api/reports/categories        → category volume + SLA rates
 *   GET /api/reports/departments       → department volume + resolution
 *   GET /api/reports/staff-performance → per-staff response counts
 *   GET /api/reports/sla               → on-time/late breakdown by category
 *   GET /api/reports/volume            → daily/weekly/monthly trends
 *   GET /api/reports/open-age          → tickets open past SLA
 *   GET /api/metrics/sla               → PUBLIC, lightweight, cached 5 minutes
 *
 * All report endpoints (except metrics) require staff or admin role.
 * All report endpoints support ?format=csv for CSV export.
 */
class ReportController
{
    private readonly \PDO $pdo;

    public function __construct(
        private readonly MetricsCache $cache,
        private readonly SlaService   $sla,
    ) {
        $this->pdo = PdoConnection::get();
    }

    // ── Authentication ────────────────────────────────────────────────────────

    /**
     * Enforce staff or admin role on protected report endpoints.
     * Terminates with 403 JSON response if caller lacks permission.
     */
    private function requireStaff(): void
    {
        $role = $_REQUEST['_callerRole'] ?? 'anonymous';
        if (!in_array($role, ['staff', 'admin'], true)) {
            http_response_code(403);
            header('Content-Type: application/json');
            echo json_encode([
                'data'   => null,
                'meta'   => [],
                'errors' => [['field' => null, 'code' => 'FORBIDDEN', 'message' => 'Staff or admin role required for reports']],
            ]);
            exit;
        }
    }

    // ── Common filter parsing ─────────────────────────────────────────────────

    /**
     * Parse common query-string filters (FRD F09 Inputs).
     * Defaults: dateFrom = 30 days ago, dateTo = today.
     */
    private function filters(): array
    {
        $dateFrom = isset($_GET['dateFrom']) ? $_GET['dateFrom'] : date('Y-m-d', strtotime('-30 days'));
        $dateTo   = isset($_GET['dateTo'])   ? $_GET['dateTo']   : date('Y-m-d');

        return [
            'dateFrom'     => $dateFrom . ' 00:00:00',
            'dateTo'       => $dateTo   . ' 23:59:59',
            'categoryId'   => !empty($_GET['categoryId'])   ? (int) $_GET['categoryId']   : null,
            'departmentId' => !empty($_GET['departmentId']) ? (int) $_GET['departmentId'] : null,
            'assigneeId'   => !empty($_GET['assigneeId'])   ? (int) $_GET['assigneeId']   : null,
            'format'       => $_GET['format'] ?? 'json',
        ];
    }

    // ── Response helpers ──────────────────────────────────────────────────────

    /**
     * Emit a JSON envelope response and terminate.
     */
    private function json(array $data, array $meta = []): never
    {
        header('Content-Type: application/json');
        echo json_encode(['data' => $data, 'meta' => $meta, 'errors' => []], JSON_THROW_ON_ERROR);
        exit;
    }

    /**
     * Stream a CSV response and terminate.
     *
     * @param array  $rows     Array of associative arrays (one row per line)
     * @param string $filename Download filename
     * @param array  $headers  CSV column headers (in order)
     */
    private function csv(array $rows, string $filename, array $headers): never
    {
        header('Content-Type: text/csv');
        header("Content-Disposition: attachment; filename=\"{$filename}\"");
        $out = fopen('php://output', 'w');
        fputcsv($out, $headers);
        foreach ($rows as $row) {
            fputcsv($out, array_values($row));
        }
        fclose($out);
        exit;
    }

    // ── Report endpoints ──────────────────────────────────────────────────────

    /**
     * GET /api/reports/activity
     * ActivityReport shape: total opened/closed for period, plus daily breakdown.
     */
    public function activity(): void
    {
        $this->requireStaff();
        $f = $this->filters();

        // Aggregate totals
        $stmt = $this->pdo->prepare(
            "SELECT
               COUNT(*) AS totalOpened,
               SUM(status = 'closed') AS totalClosed,
               SUM(status = 'open') AS openAtPeriodEnd
             FROM tickets
             WHERE datetimeOpened BETWEEN :from AND :to AND deletedAt IS NULL"
        );
        $stmt->execute(['from' => $f['dateFrom'], 'to' => $f['dateTo']]);
        $agg = $stmt->fetch(\PDO::FETCH_ASSOC);

        // Daily breakdown
        $stmt2 = $this->pdo->prepare(
            "SELECT DATE(datetimeOpened) AS date,
                    COUNT(*) AS opened,
                    SUM(status = 'closed') AS closed
             FROM tickets
             WHERE datetimeOpened BETWEEN :from AND :to AND deletedAt IS NULL
             GROUP BY DATE(datetimeOpened)
             ORDER BY date ASC"
        );
        $stmt2->execute(['from' => $f['dateFrom'], 'to' => $f['dateTo']]);
        $byDay = $stmt2->fetchAll(\PDO::FETCH_ASSOC);

        $result = [
            'period'          => ['from' => substr($f['dateFrom'], 0, 10), 'to' => substr($f['dateTo'], 0, 10)],
            'totalOpened'     => (int) $agg['totalOpened'],
            'totalClosed'     => (int) $agg['totalClosed'],
            'openAtPeriodEnd' => (int) $agg['openAtPeriodEnd'],
            'byDay'           => array_map(
                fn($r) => ['date' => $r['date'], 'opened' => (int) $r['opened'], 'closed' => (int) $r['closed']],
                $byDay
            ),
        ];

        if ($f['format'] === 'csv') {
            $this->csv($byDay, 'activity-report.csv', ['date', 'opened', 'closed']);
        }
        $this->json($result);
    }

    /**
     * GET /api/reports/assignments
     * Per-assignee ticket counts and average days to close.
     */
    public function assignments(): void
    {
        $this->requireStaff();
        $f = $this->filters();

        $stmt = $this->pdo->prepare(
            "SELECT t.personId AS assigneeId,
                    CONCAT(p.firstName, ' ', p.lastName) AS assigneeName,
                    SUM(t.status = 'open')   AS open,
                    SUM(t.status = 'closed') AS closed,
                    AVG(CASE WHEN t.datetimeClosed IS NOT NULL
                        THEN TIMESTAMPDIFF(DAY, t.datetimeOpened, t.datetimeClosed) END) AS avgDaysToClose
             FROM tickets t
             LEFT JOIN people p ON p.id = t.personId
             WHERE t.datetimeOpened BETWEEN :from AND :to AND t.deletedAt IS NULL
             GROUP BY t.personId, assigneeName
             ORDER BY closed DESC"
        );
        $stmt->execute(['from' => $f['dateFrom'], 'to' => $f['dateTo']]);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $data = array_map(fn($r) => [
            'assigneeId'     => $r['assigneeId'] ? (int) $r['assigneeId'] : null,
            'assigneeName'   => $r['assigneeName'] ?? 'Unassigned',
            'open'           => (int) $r['open'],
            'closed'         => (int) $r['closed'],
            'avgDaysToClose' => $r['avgDaysToClose'] !== null ? round((float) $r['avgDaysToClose'], 1) : null,
        ], $rows);

        if ($f['format'] === 'csv') {
            $this->csv($data, 'assignments-report.csv', ['assigneeId', 'assigneeName', 'open', 'closed', 'avgDaysToClose']);
        }
        $this->json($data);
    }

    /**
     * GET /api/reports/categories
     * Per-category volume with SLA on-time/late rates computed via SlaService.
     */
    public function categories(): void
    {
        $this->requireStaff();
        $f = $this->filters();

        $stmt = $this->pdo->prepare(
            "SELECT t.categoryId,
                    c.name AS categoryName,
                    c.slaDays,
                    COUNT(*) AS total,
                    SUM(t.status = 'open')   AS open,
                    SUM(t.status = 'closed') AS closed
             FROM tickets t
             JOIN categories c ON c.id = t.categoryId
             WHERE t.datetimeOpened BETWEEN :from AND :to AND t.deletedAt IS NULL
             GROUP BY t.categoryId, c.name, c.slaDays
             ORDER BY total DESC"
        );
        $stmt->execute(['from' => $f['dateFrom'], 'to' => $f['dateTo']]);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Compute SLA on-time/late per category using SlaService
        $data = array_map(function ($r) use ($f) {
            // Fetch closed tickets for this category in the date range to compute SLA
            $s2 = $this->pdo->prepare(
                "SELECT datetimeOpened, datetimeClosed, status FROM tickets
                 WHERE categoryId = :cid AND status = 'closed'
                   AND datetimeOpened BETWEEN :from AND :to AND deletedAt IS NULL"
            );
            $s2->execute(['cid' => $r['categoryId'], 'from' => $f['dateFrom'], 'to' => $f['dateTo']]);
            $closed  = $s2->fetchAll(\PDO::FETCH_ASSOC);
            $onTime  = 0;
            $late    = 0;
            foreach ($closed as $t) {
                $slaInfo = $this->sla->compute($t, $r['slaDays'] ? (int) $r['slaDays'] : null);
                if ($slaInfo['status'] === 'on_time') $onTime++;
                elseif ($slaInfo['status'] === 'late') $late++;
            }
            $totalClosed = count($closed);
            return [
                'categoryId'   => (int) $r['categoryId'],
                'categoryName' => $r['categoryName'],
                'slaDays'      => $r['slaDays'] ? (int) $r['slaDays'] : null,
                'total'        => (int) $r['total'],
                'open'         => (int) $r['open'],
                'closed'       => (int) $r['closed'],
                'onTime'       => $onTime,
                'late'         => $late,
                'onTimePct'    => $totalClosed > 0 ? round($onTime / $totalClosed * 100, 1) : null,
            ];
        }, $rows);

        if ($f['format'] === 'csv') {
            $this->csv($data, 'categories-report.csv', ['categoryId', 'categoryName', 'slaDays', 'total', 'open', 'closed', 'onTime', 'late', 'onTimePct']);
        }
        $this->json($data);
    }

    /**
     * GET /api/reports/departments
     * Per-department volume and average resolution time.
     */
    public function departments(): void
    {
        $this->requireStaff();
        $f = $this->filters();

        $stmt = $this->pdo->prepare(
            "SELECT t.departmentId,
                    d.name AS departmentName,
                    COUNT(*) AS total,
                    SUM(t.status = 'open')   AS open,
                    SUM(t.status = 'closed') AS closed,
                    AVG(CASE WHEN t.datetimeClosed IS NOT NULL
                        THEN TIMESTAMPDIFF(DAY, t.datetimeOpened, t.datetimeClosed) END) AS avgDaysToClose
             FROM tickets t
             JOIN departments d ON d.id = t.departmentId
             WHERE t.datetimeOpened BETWEEN :from AND :to AND t.deletedAt IS NULL
             GROUP BY t.departmentId, d.name
             ORDER BY total DESC"
        );
        $stmt->execute(['from' => $f['dateFrom'], 'to' => $f['dateTo']]);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $data = array_map(fn($r) => [
            'departmentId'   => (int) $r['departmentId'],
            'departmentName' => $r['departmentName'],
            'total'          => (int) $r['total'],
            'open'           => (int) $r['open'],
            'closed'         => (int) $r['closed'],
            'avgDaysToClose' => $r['avgDaysToClose'] !== null ? round((float) $r['avgDaysToClose'], 1) : null,
        ], $rows);

        if ($f['format'] === 'csv') {
            $this->csv($data, 'departments-report.csv', ['departmentId', 'departmentName', 'total', 'open', 'closed', 'avgDaysToClose']);
        }
        $this->json($data);
    }

    /**
     * GET /api/reports/staff-performance
     * Per-staff response counts and distinct tickets handled in the period.
     */
    public function staffPerformance(): void
    {
        $this->requireStaff();
        $f = $this->filters();

        $stmt = $this->pdo->prepare(
            "SELECT a.actorPersonId,
                    CONCAT(p.firstName, ' ', p.lastName) AS staffName,
                    COUNT(a.id) AS responseCount,
                    COUNT(DISTINCT a.ticketId) AS ticketsHandled
             FROM actions a
             JOIN people p ON p.id = a.actorPersonId
             WHERE a.type = 'response'
               AND a.datetimeCreated BETWEEN :from AND :to
             GROUP BY a.actorPersonId, staffName
             ORDER BY responseCount DESC"
        );
        $stmt->execute(['from' => $f['dateFrom'], 'to' => $f['dateTo']]);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $data = array_map(fn($r) => [
            'staffId'        => (int) $r['actorPersonId'],
            'staffName'      => $r['staffName'],
            'responseCount'  => (int) $r['responseCount'],
            'ticketsHandled' => (int) $r['ticketsHandled'],
        ], $rows);

        if ($f['format'] === 'csv') {
            $this->csv($data, 'staff-performance-report.csv', ['staffId', 'staffName', 'responseCount', 'ticketsHandled']);
        }
        $this->json($data);
    }

    /**
     * GET /api/reports/sla
     * SLA on-time/late breakdown by category, with optional date filtering.
     * Uses same computation as metrics() but without cache.
     */
    public function sla(): void
    {
        $this->requireStaff();
        $f    = $this->filters();
        $data = $this->computeSlaMetrics($f['dateFrom'], $f['dateTo']);

        if ($f['format'] === 'csv') {
            $this->csv($data, 'sla-report.csv', ['categoryId', 'categoryName', 'totalClosed', 'onTime', 'late', 'onTimePct']);
        }
        $this->json($data);
    }

    /**
     * GET /api/reports/volume
     * Daily/weekly/monthly ticket volume trends.
     * Query param: grouping=daily|weekly|monthly (default: daily)
     */
    public function volume(): void
    {
        $this->requireStaff();
        $f        = $this->filters();
        $grouping = $_GET['grouping'] ?? 'daily';

        $dateExpr = match ($grouping) {
            'weekly'  => "DATE_FORMAT(datetimeOpened, '%Y-W%u')",
            'monthly' => "DATE_FORMAT(datetimeOpened, '%Y-%m')",
            default   => 'DATE(datetimeOpened)',
        };

        $stmt = $this->pdo->prepare(
            "SELECT {$dateExpr} AS period,
                    COUNT(*) AS opened,
                    SUM(status = 'closed') AS closed
             FROM tickets
             WHERE datetimeOpened BETWEEN :from AND :to AND deletedAt IS NULL
             GROUP BY period
             ORDER BY period ASC"
        );
        $stmt->execute(['from' => $f['dateFrom'], 'to' => $f['dateTo']]);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $data = array_map(fn($r) => [
            'period' => $r['period'],
            'opened' => (int) $r['opened'],
            'closed' => (int) $r['closed'],
        ], $rows);

        if ($f['format'] === 'csv') {
            $this->csv($data, 'volume-report.csv', ['period', 'opened', 'closed']);
        }
        $this->json($data);
    }

    /**
     * GET /api/reports/open-age
     * Tickets that are currently open and past their SLA deadline.
     * Returns up to 500 overdue tickets ordered by open date (oldest first).
     */
    public function openAge(): void
    {
        $this->requireStaff();

        $stmt = $this->pdo->prepare(
            "SELECT t.id, t.title, t.datetimeOpened, c.name AS categoryName, c.slaDays,
                    CONCAT(p.firstName, ' ', p.lastName) AS assigneeName
             FROM tickets t
             JOIN categories c ON c.id = t.categoryId
             LEFT JOIN people p ON p.id = t.personId
             WHERE t.status = 'open' AND t.deletedAt IS NULL
               AND c.slaDays IS NOT NULL
               AND DATE_ADD(t.datetimeOpened, INTERVAL c.slaDays DAY) < NOW()
             ORDER BY t.datetimeOpened ASC
             LIMIT 500"
        );
        $stmt->execute();
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $now  = new \DateTimeImmutable();
        $data = array_map(function ($r) use ($now) {
            $opened  = new \DateTimeImmutable($r['datetimeOpened']);
            $slaDays = (int) $r['slaDays'];
            // Days overdue = days elapsed since open - slaDays (minimum 0)
            $daysOpen    = (int) $now->diff($opened)->days;
            $daysOverdue = max(0, $daysOpen - $slaDays);
            return [
                'ticketId'       => (int) $r['id'],
                'title'          => $r['title'],
                'categoryName'   => $r['categoryName'],
                'assigneeName'   => $r['assigneeName'] ?? 'Unassigned',
                'datetimeOpened' => $r['datetimeOpened'],
                'slaDays'        => $slaDays,
                'daysOverdue'    => $daysOverdue,
            ];
        }, $rows);

        $f = $this->filters();
        if ($f['format'] === 'csv') {
            $this->csv($data, 'open-age-report.csv', ['ticketId', 'title', 'categoryName', 'assigneeName', 'datetimeOpened', 'slaDays', 'daysOverdue']);
        }
        $this->json($data);
    }

    /**
     * GET /api/metrics/sla
     *
     * PUBLIC endpoint — no authentication required.
     * Returns lightweight SLA % per category for the last N days.
     * Response is cached for 5 minutes using MetricsCache (per FRD F09 Process: Metrics Endpoint).
     *
     * Query params:
     *   days  (int, 1–365, default: 30) — look-back window
     */
    public function metrics(): void
    {
        // Public endpoint — no requireStaff() call
        $days     = min(365, max(1, (int) ($_GET['days'] ?? 30)));
        $cacheKey = 'sla_metrics_' . $days;
        $cached   = $this->cache->get($cacheKey);

        if ($cached !== null) {
            $this->json($cached);
        }

        $dateFrom = date('Y-m-d H:i:s', strtotime("-{$days} days"));
        $dateTo   = date('Y-m-d H:i:s');

        $data = $this->computeSlaMetrics($dateFrom, $dateTo);
        $this->cache->set($cacheKey, $data, 300); // 5-minute TTL
        $this->json($data);
    }

    // ── SLA metrics computation (shared by sla() + metrics()) ─────────────────

    /**
     * Compute SLA metrics per category for the given date range.
     * Returns SlaMetric[] shape from TechArch TypeScript §4.2.
     *
     * @return array Array of per-category SLA metrics
     */
    private function computeSlaMetrics(string $dateFrom, string $dateTo): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT t.categoryId, c.name AS categoryName, c.slaDays,
                    t.datetimeOpened, t.datetimeClosed, t.status
             FROM tickets t
             JOIN categories c ON c.id = t.categoryId
             WHERE t.status = 'closed'
               AND t.datetimeOpened BETWEEN :from AND :to
               AND t.deletedAt IS NULL
               AND c.slaDays IS NOT NULL"
        );
        $stmt->execute(['from' => $dateFrom, 'to' => $dateTo]);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $byCategory = [];
        foreach ($rows as $row) {
            $cid = (int) $row['categoryId'];
            if (!isset($byCategory[$cid])) {
                $byCategory[$cid] = [
                    'categoryId'   => $cid,
                    'categoryName' => $row['categoryName'],
                    'totalClosed'  => 0,
                    'onTime'       => 0,
                    'late'         => 0,
                ];
            }
            $slaInfo = $this->sla->compute($row, (int) $row['slaDays']);
            $byCategory[$cid]['totalClosed']++;
            if ($slaInfo['status'] === 'on_time') $byCategory[$cid]['onTime']++;
            elseif ($slaInfo['status'] === 'late')  $byCategory[$cid]['late']++;
        }

        return array_values(array_map(function ($cat) {
            $cat['onTimePct'] = $cat['totalClosed'] > 0
                ? round($cat['onTime'] / $cat['totalClosed'] * 100, 1)
                : 0.0;
            return $cat;
        }, $byCategory));
    }
}
