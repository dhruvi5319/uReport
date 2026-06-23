<?php
declare(strict_types=1);
namespace Domain;

readonly class Ticket
{
    public function __construct(
        public int     $id,
        public string  $title,
        public ?string $description,
        public string  $status,           // 'open'|'closed'
        public string  $datetimeOpened,
        public ?string $datetimeClosed,
        public string  $datetimeUpdated,
        public ?string $deletedAt,
        public int     $categoryId,
        public int     $departmentId,
        public ?int    $personId,
        public ?int    $reporterPersonId,
        public ?string $reporterName,
        public ?string $reporterEmail,
        public ?string $reporterPhone,
        public ?string $address,
        public ?string $lat,
        public ?string $lng,
        public ?int    $substatusId,
        public ?int    $mergedIntoTicketId,
        public ?int    $apiClientId,
        public ?string $customFields,     // raw JSON or null
    ) {}

    public static function fromRow(array $row): static
    {
        return new static(
            id:                 (int) $row['id'],
            title:              $row['title'],
            description:        $row['description'] ?? null,
            status:             $row['status'],
            datetimeOpened:     $row['datetimeOpened'],
            datetimeClosed:     $row['datetimeClosed'] ?? null,
            datetimeUpdated:    $row['datetimeUpdated'],
            deletedAt:          $row['deletedAt'] ?? null,
            categoryId:         (int) $row['categoryId'],
            departmentId:       (int) $row['departmentId'],
            personId:           isset($row['personId']) ? (int) $row['personId'] : null,
            reporterPersonId:   isset($row['reporterPersonId']) ? (int) $row['reporterPersonId'] : null,
            reporterName:       $row['reporterName'] ?? null,
            reporterEmail:      $row['reporterEmail'] ?? null,
            reporterPhone:      $row['reporterPhone'] ?? null,
            address:            $row['address'] ?? null,
            lat:                $row['lat'] ?? null,
            lng:                $row['lng'] ?? null,
            substatusId:        isset($row['substatusId']) ? (int) $row['substatusId'] : null,
            mergedIntoTicketId: isset($row['mergedIntoTicketId']) ? (int) $row['mergedIntoTicketId'] : null,
            apiClientId:        isset($row['apiClientId']) ? (int) $row['apiClientId'] : null,
            customFields:       $row['customFields'] ?? null,
        );
    }
}
