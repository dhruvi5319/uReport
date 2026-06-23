<?php
declare(strict_types=1);
namespace Http;

use Middleware\SecurityHeadersMiddleware;
use Middleware\ErrorHandlerMiddleware;
use Middleware\AuthMiddleware;
use Services\AuthService;
use Repositories\PersonRepository;
use Repositories\CategoryRepository;
use Repositories\ClientRepository;
use Repositories\DepartmentRepository;
use Repositories\TicketRepository;
use Repositories\ActionRepository;
use Repositories\SubstatusRepository;
use Repositories\MediaRepository;
use Repositories\BookmarkRepository;
use Repositories\CategoryGroupRepository;
use Repositories\ContactMethodRepository;
use Repositories\TemplateRepository;
use Repositories\NotificationLogRepository;
use Services\TicketService;
use Services\SlaService;
use Services\NotificationService;
use Infrastructure\Cache\MetricsCache;
use Controllers\Auth\LoginController;
use Controllers\Auth\CallbackController;
use Controllers\Auth\LogoutController;
use Controllers\Auth\MeController;
use Controllers\Api\TicketController;
use Controllers\Api\SearchController;
use Controllers\Api\TicketHistoryController;
use Controllers\Api\TicketMediaController;
use Controllers\Api\PersonController;
use Controllers\Api\DepartmentController;
use Controllers\Api\CategoryController;
use Controllers\Api\CategoryGroupController;
use Controllers\Api\SubstatusController;
use Controllers\Api\ReportController;
use Controllers\Api\BookmarkController;
use Controllers\Api\GeoController;
use Controllers\Api\OpenApiController;
use Controllers\Api\ClientController;
use Controllers\Api\TemplateController;
use Controllers\Api\ContactMethodController;
use Controllers\Open311\DiscoveryController;
use Controllers\Open311\ServicesController;
use Controllers\Open311\RequestsController;

class Kernel
{
    private Router $router;

    public function __construct()
    {
        $this->router = new Router();
        $this->registerRoutes();
    }

    public function handle(): void
    {
        $request    = new Request();
        $authService = new AuthService(new PersonRepository());

        // Middleware pipeline (outermost → innermost):
        // 1. ErrorHandler  — catches all Throwables
        // 2. SecurityHeaders — sets headers on every response
        // 3. Auth           — extracts + validates JWT, sets caller context
        // 4. Router         — dispatches to controller

        $pipeline = $this->buildPipeline([
            new ErrorHandlerMiddleware(),
            new SecurityHeadersMiddleware(),
            new AuthMiddleware($authService),
        ], fn(Request $req) => $this->router->dispatch($req));

        $pipeline($request);
    }

    /**
     * Build a TicketController with all required dependencies.
     */
    private function makeTicketController(): TicketController
    {
        return new TicketController(
            new TicketService(
                new TicketRepository(),
                new ActionRepository(),
                new CategoryRepository(),
                new DepartmentRepository(),
                new PersonRepository(),
                new SubstatusRepository(),
                new NotificationService(
                    new TemplateRepository(),
                    new NotificationLogRepository(),
                    new PersonRepository(),
                    new DepartmentRepository(),
                    new TicketRepository(),
                ),
            ),
            new SlaService(),
            new TicketRepository(),
            new CategoryRepository(),
            new DepartmentRepository(),
            new PersonRepository(),
            new SubstatusRepository(),
        );
    }

    /**
     * Register all routes for /api/*, /auth/*, and /open311/*.
     */
    private function registerRoutes(): void
    {
        // ── Health check (no auth required) ─────────────────────────────────────
        $this->router->get('/api/health', function (Request $req): void {
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['status' => 'ok'], JSON_THROW_ON_ERROR);
            exit;
        });

        // ── Auth routes ──────────────────────────────────────────────────────────
        $this->router->get('/auth/login',    fn(Request $req) => (new LoginController())->handle($req));
        $this->router->get('/auth/callback', fn(Request $req) => (new CallbackController())->handle($req));
        $this->router->post('/auth/logout',  fn(Request $req) => (new LogoutController())->handle($req));
        $this->router->get('/auth/me',       fn(Request $req) => (new MeController())->handle($req));

        // ── OpenAPI / Docs ───────────────────────────────────────────────────────
        $this->router->get('/api/openapi.json', fn(Request $req) => (new OpenApiController())->spec());
        $this->router->get('/api/openapi.yaml', fn(Request $req) => (new OpenApiController())->yaml());
        $this->router->get('/api/docs',         fn(Request $req) => (new OpenApiController())->docs());

        // ── Ticket list / search ─────────────────────────────────────────────────
        $this->router->get('/api/tickets', function (Request $req): void {
            (new SearchController())->index();
        });

        // ── Ticket bulk-assign (before /{id} to avoid capture conflict) ──────────
        $this->router->post('/api/tickets/bulk-assign', function (Request $req, array $params): void {
            $this->makeTicketController()->bulkAssign($req, $params);
        });

        // ── Ticket CRUD ───────────────────────────────────────────────────────────
        $this->router->post('/api/tickets', function (Request $req, array $params): void {
            $this->makeTicketController()->create($req, $params);
        });

        $this->router->get('/api/tickets/{id}', function (Request $req, array $params): void {
            $this->makeTicketController()->show($req, $params);
        });

        $this->router->put('/api/tickets/{id}', function (Request $req, array $params): void {
            $this->makeTicketController()->update($req, $params);
        });

        $this->router->delete('/api/tickets/{id}', function (Request $req, array $params): void {
            $this->makeTicketController()->delete($req, $params);
        });

        // ── Ticket actions ────────────────────────────────────────────────────────
        $this->router->post('/api/tickets/{id}/assign', function (Request $req, array $params): void {
            $this->makeTicketController()->assign($req, $params);
        });

        $this->router->post('/api/tickets/{id}/close', function (Request $req, array $params): void {
            $this->makeTicketController()->close($req, $params);
        });

        $this->router->post('/api/tickets/{id}/reopen', function (Request $req, array $params): void {
            $this->makeTicketController()->reopen($req, $params);
        });

        $this->router->post('/api/tickets/{id}/responses', function (Request $req, array $params): void {
            $this->makeTicketController()->postResponse($req, $params);
        });

        $this->router->post('/api/tickets/{id}/comments', function (Request $req, array $params): void {
            $this->makeTicketController()->postComment($req, $params);
        });

        $this->router->post('/api/tickets/{id}/merge', function (Request $req, array $params): void {
            $this->makeTicketController()->merge($req, $params);
        });

        $this->router->get('/api/tickets/{id}/merge-candidates', function (Request $req, array $params): void {
            $this->makeTicketController()->mergeCandidates($req, $params);
        });

        // ── Ticket History ────────────────────────────────────────────────────────
        $this->router->get('/api/tickets/{id}/history', function (Request $req, array $params): void {
            (new TicketHistoryController(new TicketRepository(), new ActionRepository(), new PersonRepository()))->index($req, $params);
        });

        // ── Ticket Location ───────────────────────────────────────────────────────
        $this->router->get('/api/tickets/{id}/location', function (Request $req, array $params): void {
            (new GeoController())->location((int) $params['id']);
        });

        // ── Ticket Media ──────────────────────────────────────────────────────────
        $this->router->get('/api/tickets/{ticket_id}/media', function (Request $req, array $params): void {
            (new TicketMediaController(new TicketRepository(), new MediaRepository(), new ActionRepository()))->list((int) $params['ticket_id']);
        });

        $this->router->post('/api/tickets/{ticket_id}/media', function (Request $req, array $params): void {
            (new TicketMediaController(new TicketRepository(), new MediaRepository(), new ActionRepository()))->upload((int) $params['ticket_id']);
        });

        $this->router->get('/api/tickets/{ticket_id}/media/{media_id}', function (Request $req, array $params): void {
            (new TicketMediaController(new TicketRepository(), new MediaRepository(), new ActionRepository()))->show((int) $params['ticket_id'], (int) $params['media_id']);
        });

        $this->router->delete('/api/tickets/{ticket_id}/media/{media_id}', function (Request $req, array $params): void {
            (new TicketMediaController(new TicketRepository(), new MediaRepository(), new ActionRepository()))->delete((int) $params['ticket_id'], (int) $params['media_id']);
        });

        // ── Geo ───────────────────────────────────────────────────────────────────
        $this->router->get('/api/geo/clusters', fn(Request $req) => (new GeoController())->clusters());
        $this->router->get('/api/geo/geocode',  fn(Request $req) => (new GeoController())->geocode());

        // ── People ────────────────────────────────────────────────────────────────
        $this->router->get('/api/people', function (Request $req): void {
            $c = new PersonController(new PersonRepository(), new ContactMethodRepository());
            $result = $c->index($req->query, ['id' => $req->actorId(), 'role' => $req->actorRole() ?? 'anonymous']);
            http_response_code($result['status'] ?? 200);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($result['body'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        });

        $this->router->post('/api/people', function (Request $req): void {
            $c = new PersonController(new PersonRepository(), new ContactMethodRepository());
            $result = $c->create($req->all(), ['id' => $req->actorId(), 'role' => $req->actorRole() ?? 'anonymous']);
            http_response_code($result['status'] ?? 201);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($result['body'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        });

        $this->router->get('/api/people/{id}', function (Request $req, array $params): void {
            $c = new PersonController(new PersonRepository(), new ContactMethodRepository());
            $result = $c->show((int) $params['id'], ['id' => $req->actorId(), 'role' => $req->actorRole() ?? 'anonymous']);
            http_response_code($result['status'] ?? 200);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($result['body'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        });

        $this->router->put('/api/people/{id}', function (Request $req, array $params): void {
            $c = new PersonController(new PersonRepository(), new ContactMethodRepository());
            $result = $c->update((int) $params['id'], $req->all(), ['id' => $req->actorId(), 'role' => $req->actorRole() ?? 'anonymous']);
            http_response_code($result['status'] ?? 200);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($result['body'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        });

        $this->router->delete('/api/people/{id}', function (Request $req, array $params): void {
            $c = new PersonController(new PersonRepository(), new ContactMethodRepository());
            $result = $c->deactivate((int) $params['id'], ['id' => $req->actorId(), 'role' => $req->actorRole() ?? 'anonymous']);
            http_response_code($result['status'] ?? 200);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($result['body'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        });

        // ── Contact Methods ───────────────────────────────────────────────────────
        $this->router->get('/api/people/{person_id}/contact-methods', function (Request $req, array $params): void {
            $c = new ContactMethodController(new PersonRepository(), new ContactMethodRepository());
            $result = $c->index((int) $params['person_id'], ['id' => $req->actorId(), 'role' => $req->actorRole() ?? 'anonymous']);
            http_response_code($result['status'] ?? 200);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($result['body'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        });

        $this->router->post('/api/people/{person_id}/contact-methods', function (Request $req, array $params): void {
            $c = new ContactMethodController(new PersonRepository(), new ContactMethodRepository());
            $result = $c->create((int) $params['person_id'], $req->all(), ['id' => $req->actorId(), 'role' => $req->actorRole() ?? 'anonymous']);
            http_response_code($result['status'] ?? 201);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($result['body'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        });

        $this->router->put('/api/people/{person_id}/contact-methods/{cm_id}', function (Request $req, array $params): void {
            $c = new ContactMethodController(new PersonRepository(), new ContactMethodRepository());
            $result = $c->update((int) $params['person_id'], (int) $params['cm_id'], $req->all(), ['id' => $req->actorId(), 'role' => $req->actorRole() ?? 'anonymous']);
            http_response_code($result['status'] ?? 200);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($result['body'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        });

        $this->router->delete('/api/people/{person_id}/contact-methods/{cm_id}', function (Request $req, array $params): void {
            $c = new ContactMethodController(new PersonRepository(), new ContactMethodRepository());
            $result = $c->remove((int) $params['person_id'], (int) $params['cm_id'], ['id' => $req->actorId(), 'role' => $req->actorRole() ?? 'anonymous']);
            http_response_code($result['status'] ?? 200);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($result['body'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        });

        // ── Departments ───────────────────────────────────────────────────────────
        $this->router->get('/api/departments',      fn(Request $req) => (new DepartmentController(new DepartmentRepository(), new PersonRepository(), new TicketRepository()))->index());
        $this->router->post('/api/departments',     fn(Request $req) => (new DepartmentController(new DepartmentRepository(), new PersonRepository(), new TicketRepository()))->create());
        $this->router->get('/api/departments/{id}', function (Request $req, array $params): void {
            (new DepartmentController(new DepartmentRepository(), new PersonRepository(), new TicketRepository()))->show((int) $params['id']);
        });
        $this->router->put('/api/departments/{id}', function (Request $req, array $params): void {
            (new DepartmentController(new DepartmentRepository(), new PersonRepository(), new TicketRepository()))->update((int) $params['id']);
        });
        $this->router->delete('/api/departments/{id}', function (Request $req, array $params): void {
            (new DepartmentController(new DepartmentRepository(), new PersonRepository(), new TicketRepository()))->destroy((int) $params['id']);
        });

        // ── Categories ────────────────────────────────────────────────────────────
        $this->router->get('/api/categories',      fn(Request $req) => (new CategoryController(new CategoryRepository(), new DepartmentRepository(), new CategoryGroupRepository(), new PersonRepository()))->index());
        $this->router->post('/api/categories',     fn(Request $req) => (new CategoryController(new CategoryRepository(), new DepartmentRepository(), new CategoryGroupRepository(), new PersonRepository()))->create());
        $this->router->get('/api/categories/{id}', function (Request $req, array $params): void {
            (new CategoryController(new CategoryRepository(), new DepartmentRepository(), new CategoryGroupRepository(), new PersonRepository()))->show((int) $params['id']);
        });
        $this->router->put('/api/categories/{id}', function (Request $req, array $params): void {
            (new CategoryController(new CategoryRepository(), new DepartmentRepository(), new CategoryGroupRepository(), new PersonRepository()))->update((int) $params['id']);
        });
        $this->router->delete('/api/categories/{id}', function (Request $req, array $params): void {
            (new CategoryController(new CategoryRepository(), new DepartmentRepository(), new CategoryGroupRepository(), new PersonRepository()))->destroy((int) $params['id']);
        });

        // ── Category Groups ───────────────────────────────────────────────────────
        $this->router->get('/api/category-groups',      fn(Request $req) => (new CategoryGroupController(new CategoryGroupRepository()))->index());
        $this->router->post('/api/category-groups',     fn(Request $req) => (new CategoryGroupController(new CategoryGroupRepository()))->create());
        $this->router->put('/api/category-groups/{id}', function (Request $req, array $params): void {
            (new CategoryGroupController(new CategoryGroupRepository()))->update((int) $params['id']);
        });
        $this->router->delete('/api/category-groups/{id}', function (Request $req, array $params): void {
            (new CategoryGroupController(new CategoryGroupRepository()))->destroy((int) $params['id']);
        });

        // ── Substatuses ───────────────────────────────────────────────────────────
        $this->router->get('/api/substatuses',      fn(Request $req) => (new SubstatusController(new SubstatusRepository()))->index());
        $this->router->post('/api/substatuses',     fn(Request $req) => (new SubstatusController(new SubstatusRepository()))->create());
        $this->router->get('/api/substatuses/{id}', function (Request $req, array $params): void {
            (new SubstatusController(new SubstatusRepository()))->show((int) $params['id']);
        });
        $this->router->put('/api/substatuses/{id}', function (Request $req, array $params): void {
            (new SubstatusController(new SubstatusRepository()))->update((int) $params['id']);
        });
        $this->router->delete('/api/substatuses/{id}', function (Request $req, array $params): void {
            (new SubstatusController(new SubstatusRepository()))->destroy((int) $params['id']);
        });

        // ── Clients ───────────────────────────────────────────────────────────────
        $this->router->get('/api/clients', function (Request $req): void {
            $c = new ClientController(new ClientRepository());
            $result = $c->index($req->query, ['id' => $req->actorId(), 'role' => $req->actorRole() ?? 'anonymous']);
            http_response_code($result['status'] ?? 200);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($result['body'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        });

        $this->router->post('/api/clients', function (Request $req): void {
            $c = new ClientController(new ClientRepository());
            $result = $c->create($req->all(), ['id' => $req->actorId(), 'role' => $req->actorRole() ?? 'anonymous']);
            http_response_code($result['status'] ?? 201);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($result['body'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        });

        $this->router->get('/api/clients/{id}', function (Request $req, array $params): void {
            $c = new ClientController(new ClientRepository());
            $result = $c->show((int) $params['id'], ['id' => $req->actorId(), 'role' => $req->actorRole() ?? 'anonymous']);
            http_response_code($result['status'] ?? 200);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($result['body'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        });

        $this->router->put('/api/clients/{id}', function (Request $req, array $params): void {
            $c = new ClientController(new ClientRepository());
            $result = $c->update((int) $params['id'], $req->all(), ['id' => $req->actorId(), 'role' => $req->actorRole() ?? 'anonymous']);
            http_response_code($result['status'] ?? 200);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($result['body'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        });

        $this->router->delete('/api/clients/{id}', function (Request $req, array $params): void {
            $c = new ClientController(new ClientRepository());
            $result = $c->deactivate((int) $params['id'], ['id' => $req->actorId(), 'role' => $req->actorRole() ?? 'anonymous']);
            http_response_code($result['status'] ?? 200);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($result['body'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        });

        $this->router->post('/api/clients/{id}/regenerate-key', function (Request $req, array $params): void {
            $c = new ClientController(new ClientRepository());
            $result = $c->regenerateKey((int) $params['id'], ['id' => $req->actorId(), 'role' => $req->actorRole() ?? 'anonymous']);
            http_response_code($result['status'] ?? 200);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($result['body'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        });

        // ── Templates ─────────────────────────────────────────────────────────────
        $this->router->get('/api/templates', function (Request $req): void {
            $c = new TemplateController(new TemplateRepository());
            $result = $c->index($req->query, ['id' => $req->actorId(), 'role' => $req->actorRole() ?? 'anonymous']);
            http_response_code($result['status'] ?? 200);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($result['body'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        });

        $this->router->post('/api/templates', function (Request $req): void {
            $c = new TemplateController(new TemplateRepository());
            $result = $c->create($req->all(), ['id' => $req->actorId(), 'role' => $req->actorRole() ?? 'anonymous']);
            http_response_code($result['status'] ?? 201);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($result['body'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        });

        $this->router->get('/api/templates/{id}', function (Request $req, array $params): void {
            $c = new TemplateController(new TemplateRepository());
            $result = $c->show((int) $params['id'], ['id' => $req->actorId(), 'role' => $req->actorRole() ?? 'anonymous']);
            http_response_code($result['status'] ?? 200);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($result['body'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        });

        $this->router->put('/api/templates/{id}', function (Request $req, array $params): void {
            $c = new TemplateController(new TemplateRepository());
            $result = $c->update((int) $params['id'], $req->all(), ['id' => $req->actorId(), 'role' => $req->actorRole() ?? 'anonymous']);
            http_response_code($result['status'] ?? 200);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($result['body'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        });

        $this->router->delete('/api/templates/{id}', function (Request $req, array $params): void {
            $c = new TemplateController(new TemplateRepository());
            $result = $c->delete((int) $params['id'], ['id' => $req->actorId(), 'role' => $req->actorRole() ?? 'anonymous']);
            http_response_code($result['status'] ?? 200);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($result['body'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        });

        // ── Bookmarks ─────────────────────────────────────────────────────────────
        $this->router->get('/api/bookmarks', function (Request $req): void {
            $personId = $req->actorId() ?? 0;
            (new BookmarkController(new BookmarkRepository()))->index($personId);
        });

        $this->router->post('/api/bookmarks', function (Request $req): void {
            $personId = $req->actorId() ?? 0;
            (new BookmarkController(new BookmarkRepository()))->create($req->all(), $personId);
        });

        $this->router->get('/api/bookmarks/{id}', function (Request $req, array $params): void {
            $personId = $req->actorId() ?? 0;
            (new BookmarkController(new BookmarkRepository()))->show((int) $params['id'], $personId);
        });

        $this->router->delete('/api/bookmarks/{id}', function (Request $req, array $params): void {
            $personId = $req->actorId() ?? 0;
            (new BookmarkController(new BookmarkRepository()))->delete((int) $params['id'], $personId);
        });

        // ── Reports ───────────────────────────────────────────────────────────────
        $this->router->get('/api/reports/activity',          fn(Request $req) => (new ReportController(new MetricsCache(), new SlaService()))->activity());
        $this->router->get('/api/reports/assignments',       fn(Request $req) => (new ReportController(new MetricsCache(), new SlaService()))->assignments());
        $this->router->get('/api/reports/categories',        fn(Request $req) => (new ReportController(new MetricsCache(), new SlaService()))->categories());
        $this->router->get('/api/reports/departments',       fn(Request $req) => (new ReportController(new MetricsCache(), new SlaService()))->departments());
        $this->router->get('/api/reports/staff-performance', fn(Request $req) => (new ReportController(new MetricsCache(), new SlaService()))->staffPerformance());
        $this->router->get('/api/reports/sla',               fn(Request $req) => (new ReportController(new MetricsCache(), new SlaService()))->sla());
        $this->router->get('/api/reports/volume',            fn(Request $req) => (new ReportController(new MetricsCache(), new SlaService()))->volume());
        $this->router->get('/api/reports/open-age',          fn(Request $req) => (new ReportController(new MetricsCache(), new SlaService()))->openAge());
        $this->router->get('/api/metrics/sla',               fn(Request $req) => (new ReportController(new MetricsCache(), new SlaService()))->metrics());

        // ── Open311 (new controllers) ─────────────────────────────────────────────
        $baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http')
                 . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost');

        $this->router->get('/open311/discovery.json', function (Request $req) use ($baseUrl): void {
            (new DiscoveryController($baseUrl))->show(['format' => 'json']);
        });
        $this->router->get('/open311/discovery.xml', function (Request $req) use ($baseUrl): void {
            (new DiscoveryController($baseUrl))->show(['format' => 'xml']);
        });
        $this->router->get('/open311/discovery', function (Request $req) use ($baseUrl): void {
            $format = $req->query['format'] ?? 'json';
            (new DiscoveryController($baseUrl))->show(['format' => $format]);
        });

        $this->router->get('/open311/services', function (Request $req): void {
            $params = $req->query;
            (new ServicesController(new CategoryRepository()))->index($params);
        });
        $this->router->get('/open311/services/{service_code}', function (Request $req, array $params): void {
            $format = $req->query['format'] ?? 'json';
            (new ServicesController(new CategoryRepository()))->show((int) $params['service_code'], ['format' => $format]);
        });

        $this->router->get('/open311/requests', function (Request $req): void {
            $params = $req->query;
            (new RequestsController(
                new TicketRepository(),
                new ActionRepository(),
                new CategoryRepository(),
                new ClientRepository(),
                new DepartmentRepository(),
                new PersonRepository(),
            ))->index($params);
        });
        $this->router->post('/open311/requests', function (Request $req): void {
            // Open311 POST can use form-data or JSON body
            $body   = !empty($req->all()) ? $req->all() : $_POST;
            $format = $body['format'] ?? $req->query['format'] ?? 'json';
            (new RequestsController(
                new TicketRepository(),
                new ActionRepository(),
                new CategoryRepository(),
                new ClientRepository(),
                new DepartmentRepository(),
                new PersonRepository(),
            ))->create($body, ['format' => $format]);
        });
        $this->router->get('/open311/requests/{id}', function (Request $req, array $params): void {
            $format = $req->query['format'] ?? 'json';
            (new RequestsController(
                new TicketRepository(),
                new ActionRepository(),
                new CategoryRepository(),
                new ClientRepository(),
                new DepartmentRepository(),
                new PersonRepository(),
            ))->show((int) $params['id'], ['format' => $format]);
        });
    }

    /**
     * Compose a middleware stack into a single callable.
     * @param array<object> $middlewares
     */
    private function buildPipeline(array $middlewares, callable $core): callable
    {
        $stack = $core;
        foreach (array_reverse($middlewares) as $middleware) {
            $next  = $stack;
            $stack = fn(Request $req) => $middleware->handle($req, $next);
        }
        return $stack;
    }
}
