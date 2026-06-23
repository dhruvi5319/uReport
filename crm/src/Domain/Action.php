<?php
declare(strict_types=1);
namespace Domain;

readonly class Action
{
    // Valid type values from TechArch DDL ENUM:
    public const TYPES = [
        'open','assignment','closed','reopen',
        'response','comment','upload',
        'deleted','merged','substatus','notification_sent',
    ];

    public function __construct(
        public int     $id,
        public int     $ticketId,
        public string  $type,        // one of self::TYPES
        public string  $visibility,  // 'external'|'internal'
        public ?int    $actorPersonId,
        public ?int    $actorClientId,
        public string  $datetimeCreated,
        public ?string $payload,     // raw JSON or null
    ) {}

    public static function fromRow(array $row): static
    {
        return new static(
            id:              (int) $row['id'],
            ticketId:        (int) $row['ticketId'],
            type:            $row['type'],
            visibility:      $row['visibility'],
            actorPersonId:   isset($row['actorPersonId']) ? (int) $row['actorPersonId'] : null,
            actorClientId:   isset($row['actorClientId']) ? (int) $row['actorClientId'] : null,
            datetimeCreated: $row['datetimeCreated'],
            payload:         $row['payload'] ?? null,
        );
    }
}
