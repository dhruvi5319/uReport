<?php

declare(strict_types=1);

namespace Controllers\Api;

use Infrastructure\Database\PdoConnection;
use Services\AddressService;
use Services\GeoClusterService;

/**
 * GeoController — geospatial endpoints.
 *
 * F5: Geospatial Features
 *
 * Endpoints:
 *   GET /api/tickets/clusters      — cluster map data
 *   GET /api/geocode               — address → lat/lng (staff utility)
 *   GET /api/tickets/{id}/location — ticket_geodata record
 */
class GeoController
{
    private GeoClusterService $clusters;
    private AddressService $address;
    private \PDO $pdo;

    public function __construct(
        ?GeoClusterService $clusters = null,
        ?AddressService    $address  = null,
        ?\PDO              $pdo      = null,
    ) {
        $this->clusters = $clusters ?? new GeoClusterService();
        $this->address  = $address  ?? new AddressService();
        $this->pdo      = $pdo      ?? PdoConnection::get();
    }

    /**
     * GET /api/tickets/clusters
     * Query params: bbox, zoom, plus any search filter params (status, categoryId, etc.)
     *
     * Returns: { data: GeoCluster[], meta: {}, errors: [] }
     * GeoCluster: { lat: float, lng: float, count: int, zoom: int }
     */
    public function clusters(): void
    {
        $params = [
            'bbox'         => $_GET['bbox'] ?? null,
            'zoom'         => isset($_GET['zoom']) ? (int) $_GET['zoom'] : 10,
            'status'       => $_GET['status'] ?? null,
            'categoryId'   => isset($_GET['categoryId'])
                ? (is_array($_GET['categoryId']) ? $_GET['categoryId'] : [(int) $_GET['categoryId']])
                : null,
            'departmentId' => isset($_GET['departmentId'])
                ? (is_array($_GET['departmentId']) ? $_GET['departmentId'] : [(int) $_GET['departmentId']])
                : null,
        ];

        // Validate bbox if present
        if ($params['bbox'] !== null) {
            $parts = explode(',', $params['bbox']);
            if (count($parts) !== 4) {
                http_response_code(422);
                $this->jsonResponse(['data' => null, 'meta' => [], 'errors' => [
                    ['field' => 'bbox', 'message' => 'Bounding box must be minLat,minLng,maxLat,maxLng', 'code' => 'INVALID_BBOX'],
                ]]);
                return;
            }
        }

        // Validate zoom
        $zoom           = max(1, min(20, $params['zoom']));
        $params['zoom'] = $zoom;

        $clusterData = $this->clusters->getClusters($params);

        $this->jsonResponse([
            'data'   => $clusterData,
            'meta'   => [],
            'errors' => [],
        ]);
    }

    /**
     * GET /api/geocode?address=<string>
     * Staff only — geocode utility for SPA map picker.
     *
     * Returns: { data: { lat, lng, addressNormalized }, meta: {}, errors: [] }
     * From TechArch §4.3: GET /api/geocode | staff | Geocode address string
     */
    public function geocode(): void
    {
        $address = trim($_GET['address'] ?? '');

        if ($address === '') {
            http_response_code(422);
            $this->jsonResponse(['data' => null, 'meta' => [], 'errors' => [
                ['field' => 'address', 'message' => 'Address parameter is required', 'code' => 'ADDRESS_REQUIRED'],
            ]]);
            return;
        }

        if (mb_strlen($address) > 500) {
            http_response_code(422);
            $this->jsonResponse(['data' => null, 'meta' => [], 'errors' => [
                ['field' => 'address', 'message' => 'Address must be 500 characters or less', 'code' => 'ADDRESS_TOO_LONG'],
            ]]);
            return;
        }

        $result = $this->address->geocode($address);

        if ($result === null) {
            // Non-fatal per FRD F05: geocoding failure is not an error, just no result
            http_response_code(422);
            $this->jsonResponse(['data' => null, 'meta' => [], 'errors' => [
                ['field' => 'address', 'message' => 'Address could not be geocoded; please provide coordinates manually', 'code' => 'ADDRESS_NOT_FOUND'],
            ]]);
            return;
        }

        $this->jsonResponse([
            'data'   => [
                'lat'               => $result['lat'],
                'lng'               => $result['lng'],
                'addressNormalized' => $result['addressNormalized'],
            ],
            'meta'   => [],
            'errors' => [],
        ]);
    }

    /**
     * GET /api/tickets/{id}/location
     * Returns ticket_geodata record for a specific ticket.
     * From TechArch §4.3: GET /api/tickets/{id}/location | Any (visibility-checked)
     */
    public function location(int $ticketId): void
    {
        $stmt = $this->pdo->prepare(
            'SELECT tg.* FROM ticket_geodata tg
             JOIN tickets t ON t.id = tg.ticketId
             WHERE tg.ticketId = :ticketId AND t.deletedAt IS NULL'
        );
        $stmt->execute(['ticketId' => $ticketId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        if ($row === false) {
            http_response_code(404);
            $this->jsonResponse(['data' => null, 'meta' => [], 'errors' => [
                ['field' => null, 'message' => 'Ticket not found or has no location data', 'code' => 'NOT_FOUND'],
            ]]);
            return;
        }

        $this->jsonResponse([
            'data'   => [
                'ticketId'          => (int) $row['ticketId'],
                'lat'               => $row['lat'] !== null ? (float) $row['lat'] : null,
                'lng'               => $row['lng'] !== null ? (float) $row['lng'] : null,
                'address'           => $row['address'],
                'addressNormalized' => $row['addressNormalized'],
                'geoStatus'         => $row['geoStatus'],
            ],
            'meta'   => [],
            'errors' => [],
        ]);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private function jsonResponse(array $data): void
    {
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=UTF-8');
        }
        echo json_encode($data, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
    }
}
