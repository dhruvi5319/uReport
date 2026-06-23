<?php
/**
 * API entry point — handles /api/*, /auth/*, and /open311/* requests.
 *
 * The legacy app (index.php) handles all other routes.
 * Apache RewriteRules in infra/apache.conf direct the above prefixes here.
 *
 * @copyright 2012-2026 City of Bloomington, Indiana
 * @license http://www.gnu.org/licenses/agpl.txt GNU/AGPL, see LICENSE
 */
declare(strict_types=1);

include __DIR__ . '/../bootstrap.php';

$kernel = new Http\Kernel();
$kernel->handle();
