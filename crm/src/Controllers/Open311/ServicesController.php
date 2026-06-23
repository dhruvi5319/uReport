<?php
declare(strict_types=1);
namespace Controllers\Open311;

use Repositories\CategoryRepository;

class ServicesController
{
    public function __construct(
        private readonly CategoryRepository $categoryRepo,
    ) {}

    /**
     * GET /open311/services[?format=xml|json][&jurisdiction_id=...]
     * Returns GeoReport v2 services list.
     */
    public function index(array $params = []): void
    {
        // Load active categories that allow public or anonymous posting
        $categories = $this->categoryRepo->findAll(activeOnly: true);
        $services   = [];

        foreach ($categories as $cat) {
            if (!in_array($cat->postingPermission, ['public', 'anonymous'], true)) {
                continue; // staff-only categories not exposed via Open311
            }
            $services[] = $this->categoryToServiceObject($cat);
        }

        $this->respond($services, $params['format'] ?? 'json', 'services', 'service');
    }

    /**
     * GET /open311/services/{service_code}[?format=xml|json]
     * Returns a single service definition with attributes[] for custom fields.
     */
    public function show(int $serviceCode, array $params = []): void
    {
        $cat = $this->categoryRepo->findById($serviceCode);

        if ($cat === null || !$cat->active) {
            $this->respondError(404, 'service_code not found', $params['format'] ?? 'json');
            return;
        }

        $service = $this->categoryToServiceObject($cat);

        // Add attributes[] for custom field definitions (Open311 metadata)
        $service['attributes'] = [];
        if ($cat->fields !== null) {
            $fields = json_decode($cat->fields, true, 512, JSON_THROW_ON_ERROR);
            foreach ($fields as $field) {
                $attr = [
                    'variable'    => true,
                    'code'        => $field['code'],
                    'datatype'    => $this->mapFieldType($field['type']),
                    'required'    => (bool) ($field['required'] ?? false),
                    'description' => $field['label'],
                    'order'       => 1,
                    'values'      => [],
                ];
                if ($field['type'] === 'select' && !empty($field['options'])) {
                    foreach ($field['options'] as $opt) {
                        $attr['values'][] = ['key' => $opt, 'name' => $opt];
                    }
                }
                $service['attributes'][] = $attr;
            }
        }

        $this->respond([$service], $params['format'] ?? 'json', 'services', 'service');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function categoryToServiceObject(\Domain\Category $cat): array
    {
        return [
            'service_code' => (string) $cat->id,
            'service_name' => $cat->name,
            'description'  => '',
            'metadata'     => $cat->fields !== null,
            'type'         => 'realtime',
            'keywords'     => [],
            'group'        => '', // category group name could be added if groupId resolved
        ];
    }

    /** Map internal field type → Open311 datatype string */
    private function mapFieldType(string $type): string
    {
        return match ($type) {
            'text'     => 'string',
            'select'   => 'singlevaluelist',
            'date'     => 'datetime',
            'checkbox' => 'boolean',
            default    => 'string',
        };
    }

    private function respond(array $data, string $format, string $rootEl, string $itemEl): void
    {
        if ($format === 'xml') {
            header('Content-Type: application/xml; charset=utf-8');
            echo $this->toXml($data, $rootEl, $itemEl);
        } else {
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($data, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        }
    }

    private function respondError(int $code, string $desc, string $format): void
    {
        http_response_code($code);
        $error = [['code' => $code, 'description' => $desc]];
        if ($format === 'xml') {
            header('Content-Type: application/xml; charset=utf-8');
            echo '<?xml version="1.0" encoding="utf-8"?><errors><error><code>' . $code . '</code><description>' . htmlspecialchars($desc) . '</description></error></errors>';
        } else {
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($error, JSON_THROW_ON_ERROR);
        }
    }

    private function toXml(array $items, string $rootEl, string $itemEl): string
    {
        $xml = '<?xml version="1.0" encoding="utf-8"?>' . "\n" . "<{$rootEl}>\n";
        foreach ($items as $item) {
            $xml .= "  <{$itemEl}>\n";
            foreach ($item as $key => $value) {
                if (is_array($value)) {
                    $xml .= "    <{$key}>\n";
                    foreach ($value as $child) {
                        if (is_array($child)) {
                            $xml .= "      <value>\n";
                            foreach ($child as $ck => $cv) {
                                $xml .= "        <{$ck}>" . htmlspecialchars((string) $cv) . "</{$ck}>\n";
                            }
                            $xml .= "      </value>\n";
                        } else {
                            $xml .= '      ' . htmlspecialchars((string) $child) . "\n";
                        }
                    }
                    $xml .= "    </{$key}>\n";
                } else {
                    $xml .= "    <{$key}>" . htmlspecialchars((string) $value) . "</{$key}>\n";
                }
            }
            $xml .= "  </{$itemEl}>\n";
        }
        $xml .= "</{$rootEl}>\n";
        return $xml;
    }
}
