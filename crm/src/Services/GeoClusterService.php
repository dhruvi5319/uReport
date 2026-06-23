<?php

declare(strict_types=1);

namespace Services;

use Infrastructure\Database\PdoConnection;

/**
 * GeoClusterService — returns ticket geo-cluster data for map density rendering.
 *
 * Primary source: Solr spatial heatmap facet (live, filtered by search params).
 * Fallback: geoclusters MySQL cache table (pre-computed, unfiltered).
 *
 * F5: Geo-Cluster Map Data process
 */
class GeoClusterService
{
    private SearchService $search;
    private \PDO $pdo;

    public function __construct(?SearchService $search = null, ?\PDO $pdo = null)
    {
        $this->search = $search ?? new SearchService();
        $this->pdo    = $pdo ?? PdoConnection::get();
    }

    /**
     * Return cluster array for map rendering.
     *
     * $params accepted keys: bbox, zoom (1–20), plus all SearchService filter params.
     *
     * Returns array of:
     *   [['lat' => float, 'lng' => float, 'count' => int, 'zoom' => int], ...]
     */
    public function getClusters(array $params): array
    {
        $zoom = max(1, min(20, (int) ($params['zoom'] ?? 10)));

        // Attempt Solr spatial heatmap
        try {
            return $this->getFromSolr($params, $zoom);
        } catch (\Exception $e) {
            // Fall back to MySQL geoclusters cache
            error_log('[GeoClusterService] Solr unavailable, falling back to geoclusters table: ' . $e->getMessage());
            return $this->getFromCache($zoom, $params['bbox'] ?? null);
        }
    }

    /**
     * Query Solr spatial heatmap facet to build dynamic clusters.
     */
    private function getFromSolr(array $params, int $zoom): array
    {
        $solr  = $this->search->getSolrClient();
        $query = $solr->createSelect();
        $query->setQuery('*:*');
        $query->setRows(0); // we only need facets, not docs

        // Apply same filters as search (excluding pagination/sort)
        $fq = ['-deletedAt:[* TO *]'];
        if (!empty($params['status'])) {
            $fq[] = 'status:' . $params['status'];
        }
        if (!empty($params['categoryId'])) {
            $ids  = is_array($params['categoryId']) ? $params['categoryId'] : [$params['categoryId']];
            $fq[] = 'categoryId:(' . implode(' OR ', array_map('intval', $ids)) . ')';
        }
        if (!empty($params['departmentId'])) {
            $ids  = is_array($params['departmentId']) ? $params['departmentId'] : [$params['departmentId']];
            $fq[] = 'departmentId:(' . implode(' OR ', array_map('intval', $ids)) . ')';
        }
        if (!empty($params['bbox'])) {
            [$minLat, $minLng, $maxLat, $maxLng] = explode(',', $params['bbox']);
            $fq[] = "lat:[{$minLat} TO {$maxLat}] AND lng:[{$minLng} TO {$maxLng}]";
        }
        foreach ($fq as $filter) {
            $query->createFilterQuery(md5($filter))->setQuery($filter);
        }

        // Spatial heatmap facet — grid resolution tied to zoom level
        $gridLevel = max(1, min(11, (int) round($zoom * 0.55)));

        // Parse bbox for geom parameter
        $geom = '[-180 -90 TO 180 90]';
        if (!empty($params['bbox'])) {
            $parts = explode(',', $params['bbox']);
            if (count($parts) === 4) {
                [$minLat, $minLng, $maxLat, $maxLng] = $parts;
                $geom = sprintf('[%s %s TO %s %s]', $minLng, $minLat, $maxLng, $maxLat);
            }
        }

        // Use JSON facets for heatmap (Solr 7+)
        $query->getParams()->add('json.facet', json_encode([
            'heatmap' => [
                'type'       => 'heatmap',
                'field'      => 'location',
                'gridLevel'  => $gridLevel,
                'geom'       => $geom,
                'distErrPct' => 0.1,
            ],
        ]));

        $result   = $solr->select($query);
        $response = $result->getData();

        $clusters = [];
        $heatmap  = $response['facets']['heatmap'] ?? null;

        if ($heatmap && !empty($heatmap['counts_ints2D'])) {
            $minLat  = (float) ($heatmap['minY'] ?? -90);
            $maxLat  = (float) ($heatmap['maxY'] ?? 90);
            $minLng  = (float) ($heatmap['minX'] ?? -180);
            $maxLng  = (float) ($heatmap['maxX'] ?? 180);
            $rows    = $heatmap['rows']    ?? 1;
            $columns = $heatmap['columns'] ?? 1;
            $latStep = ($maxLat - $minLat) / max(1, $rows);
            $lngStep = ($maxLng - $minLng) / max(1, $columns);

            foreach ($heatmap['counts_ints2D'] as $r => $row) {
                if (!is_array($row)) {
                    continue;
                }
                foreach ($row as $c => $count) {
                    if ($count > 0) {
                        $clusters[] = [
                            'lat'   => round($minLat + ($r + 0.5) * $latStep, 6),
                            'lng'   => round($minLng + ($c + 0.5) * $lngStep, 6),
                            'count' => (int) $count,
                            'zoom'  => $zoom,
                        ];
                    }
                }
            }
        }

        return $clusters;
    }

    /**
     * Fallback: read from the geoclusters MySQL cache table.
     * Optionally filter by bbox.
     */
    private function getFromCache(int $zoom, ?string $bbox): array
    {
        $where  = ['zoom = :zoom'];
        $params = ['zoom' => $zoom];

        if ($bbox !== null) {
            [$minLat, $minLng, $maxLat, $maxLng] = explode(',', $bbox);
            $where[]          = 'lat BETWEEN :minLat AND :maxLat';
            $where[]          = 'lng BETWEEN :minLng AND :maxLng';
            $params['minLat'] = $minLat;
            $params['maxLat'] = $maxLat;
            $params['minLng'] = $minLng;
            $params['maxLng'] = $maxLng;
        }

        $sql  = 'SELECT lat, lng, count, zoom FROM geoclusters WHERE ' . implode(' AND ', $where);
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        $clusters = [];
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $clusters[] = [
                'lat'   => (float) $row['lat'],
                'lng'   => (float) $row['lng'],
                'count' => (int) $row['count'],
                'zoom'  => (int) $row['zoom'],
            ];
        }

        return $clusters;
    }
}
