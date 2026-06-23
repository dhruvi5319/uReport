<?php
// db/phinx.php — Phinx migration configuration for uReport
return [
    'paths' => [
        'migrations' => __DIR__ . '/migrations',
        'seeds'      => __DIR__ . '/seeds',
    ],
    'environments' => [
        'default_migration_table' => 'phinx_migrations',
        'default_environment' => 'development',
        'development' => [
            'adapter'   => 'mysql',
            'host'      => getenv('DB_HOST') ?: 'db',
            'name'      => getenv('DB_NAME') ?: 'ureport',
            'user'      => getenv('DB_USER') ?: 'ureport',
            'pass'      => getenv('DB_PASS') ?: 'ureport',
            'port'      => getenv('DB_PORT') ?: '3306',
            'charset'   => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ],
        'production' => [
            'adapter'   => 'mysql',
            'host'      => getenv('DB_HOST'),
            'name'      => getenv('DB_NAME'),
            'user'      => getenv('DB_USER'),
            'pass'      => getenv('DB_PASS'),
            'port'      => getenv('DB_PORT') ?: '3306',
            'charset'   => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ],
    ],
    'version_order' => 'creation',
];
