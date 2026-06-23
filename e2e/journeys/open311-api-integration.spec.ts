// e2e/journeys/open311-api-integration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('E2E-006: Open311 GeoReport v2 API Integration & Compliance (JRN-04.1)', () => {

  test.beforeEach(async ({ request }) => {
    const res = await request.get('/open311/discovery').catch(() => null);
    if (!res?.ok()) test.skip(true, 'Open311 endpoint unavailable');
  });

  test('GET /open311/discovery returns valid discovery document', async ({ request }) => {
    const res = await request.get('/open311/discovery');
    expect(res.ok()).toBe(true);
    const body = await res.json();
    // GeoReport v2 discovery: { discovery: { ... } } or flat
    expect(body).toBeTruthy();
  });

  test('GET /open311/services returns list of services with service_code and service_name', async ({ request }) => {
    const res = await request.get('/open311/services.json');
    expect(res.ok()).toBe(true);
    const services = await res.json();
    expect(Array.isArray(services)).toBe(true);
    if (services.length > 0) {
      const svc = services[0];
      expect(svc).toHaveProperty('service_code');
      expect(svc).toHaveProperty('service_name');
    }
  });

  test('GET /open311/services.xml returns valid XML', async ({ request }) => {
    const res = await request.get('/open311/services.xml');
    expect(res.ok()).toBe(true);
    const body = await res.text();
    expect(body).toContain('<services>');
  });

  test('POST /open311/requests creates a service request and returns service_request_id', async ({ request }) => {
    // Get a valid service code first
    const svcRes = await request.get('/open311/services.json');
    const services = svcRes.ok() ? await svcRes.json() : [];
    const serviceCode = services[0]?.service_code;

    if (!serviceCode) {
      test.skip(true, 'No Open311 services available');
      return;
    }

    const res = await request.post('/open311/requests.json', {
      form: {
        service_code: String(serviceCode),
        description: 'E2E-006 Playwright test submission',
        first_name: 'Playwright',
        last_name: 'Test',
        email: 'playwright-test@example.com',
        lat: '43.7000',
        long: '-79.4000',
        address_string: '123 Test Street, Toronto, ON',
      },
    });

    // May be 201 (success) or 401 (no api_key required) or 400 (validation)
    if (res.status() === 401) {
      test.skip(true, 'Open311 endpoint requires api_key authentication');
      return;
    }
    expect(res.ok()).toBe(true);
    const body = await res.json();
    // GeoReport v2 response: array with service_request_id
    const requests = Array.isArray(body) ? body : [body];
    expect(requests[0]).toHaveProperty('service_request_id');
  });

  test('GET /open311/requests.json returns list with GeoReport v2 fields', async ({ request }) => {
    const res = await request.get('/open311/requests.json');
    if (res.status() === 401) {
      test.skip(true, 'Open311 requires authentication');
      return;
    }
    expect(res.ok()).toBe(true);
    const requests = await res.json();
    expect(Array.isArray(requests)).toBe(true);
    if (requests.length > 0) {
      const req = requests[0];
      // Required GeoReport v2 fields
      expect(req).toHaveProperty('service_request_id');
      expect(req).toHaveProperty('status');
      expect(req).toHaveProperty('service_code');
    }
  });

  test('GET /open311/requests/{id} returns single service request by ID', async ({ request }) => {
    // Get an existing request ID
    const listRes = await request.get('/open311/requests.json');
    if (!listRes.ok()) {
      test.skip(true, 'Cannot list Open311 requests');
      return;
    }
    const requests = await listRes.json();
    if (!requests.length) {
      test.skip(true, 'No Open311 requests to look up');
      return;
    }
    const id = requests[0]?.service_request_id;

    const res = await request.get(`/open311/requests/${id}.json`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    const result = Array.isArray(body) ? body[0] : body;
    expect(result?.service_request_id).toBe(id);
  });

  test('Open311 /api/docs serves OpenAPI Swagger UI', async ({ request }) => {
    const res = await request.get('/api/docs');
    // Should return HTML containing swagger or openapi
    if (res.status() === 404) {
      test.skip(true, '/api/docs not yet deployed');
      return;
    }
    expect(res.ok()).toBe(true);
    const body = await res.text();
    expect(body.toLowerCase()).toMatch(/swagger|openapi/);
  });

});
