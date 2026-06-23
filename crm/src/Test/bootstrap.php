<?php
/**
 * @copyright 2026 City of Bloomington, Indiana
 * @license https://www.gnu.org/licenses/agpl.txt GNU/AGPL, see LICENSE
 */
declare (strict_types=1);
$_SERVER['SITE_HOME'] = __DIR__.'/data';

// Load main bootstrap if it exists (sets up $DATABASES from site config)
$bootstrapPath = realpath(__DIR__.'/../../bootstrap.php');
if ($bootstrapPath && file_exists($bootstrapPath)) {
    // Only include if vendor/autoload.php exists (full installation)
    $autoloadPath = realpath(__DIR__.'/../../vendor/autoload.php');
    if ($autoloadPath) {
        include $bootstrapPath;
    }
}

if (!empty($DATABASES)) {
    $GLOBALS['DATABASES'] = $DATABASES;
}

// SQLite fallback — allows unit tests to instantiate repositories without a real DB
if (empty($GLOBALS['DATABASES']['default'])) {
    $GLOBALS['DATABASES']['default'] = [
        'dsn'  => 'sqlite::memory:',
        'user' => '',
        'pass' => '',
    ];
}
