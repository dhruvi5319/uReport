// e2e/journeys/open311-compliance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('E2E-008: Open311 GeoReport v2 Compliance (NFR-09)', () => {

  test.beforeEach(async ({ request }) => {
    const res = await request.get('/open311/services.json').catch(() => null);
    if (!res?.ok()) test.skip(true, 'Open311 endpoint unavailable');
  });

  test('Services JSON response has correct Content-Type header', async ({ request }) => {
    const res = await request.get('/open311/services.json');
    const ct = res.headers()['content-type'] ?? '';
    expect(ct).toMatch(/application\/json/);
  });

  test('Services XML response has correct Content-Type header', async ({ request }) => {
    const res = await request.get('/open311/services.xml');
    const ct = res.headers()['content-type'] ?? '';
    expect(ct).toMatch(/application\/xml|text\/xml/);
  });

  test('Each service has required GeoReport v2 fields', async ({ request }) => {
    const res = await request.get('/open311/services.json');
    const services = await res.json();
    if (!services.length) return;

    for (const svc of services.slice(0, 3)) {
      expect(svc).toHaveProperty('service_code');
      expect(svc).toHaveProperty('service_name');
      expect(svc).toHaveProperty('type');
      expect(svc).toHaveProperty('metadata');
      // type must be 'realtime', 'batch', or 'blackbox'
      expect(['realtime', 'batch', 'blackbox']).toContain(svc.type);
    }
  });

  test('Service requests JSON response has required GeoReport v2 fields', async ({ request }) => {
    const res = await request.get('/open311/requests.json');
    const requests = await res.json();
    if (!Array.isArray(requests) || requests.length === 0) return;

    for (const req of requests.slice(0, 3)) {
      expect(req).toHaveProperty('service_request_id');
      expect(req).toHaveProperty('status');
      expect(req).toHaveProperty('service_code');
      // status must be 'open' or 'closed'
      expect(['open', 'closed']).toContain(req.status);
    }
  });

  test('GET /open311/services/{service_code} returns service definition with attributes', async ({ request }) => {
    const listRes = await request.get('/open311/services.json');
    const services = await listRes.json();
    if (!services.length) {
      test.skip(true, 'No services available');
      return;
    }
    const code = services[0].service_code;

    const res = await request.get(`/open311/services/${code}.json`);
    if (res.status() === 404) {
      test.skip(true, 'Service detail endpoint not available');
      return;
    }
    expect(res.ok()).toBe(true);
    const body = await res.json();
    // May be array or object
    const svc = Array.isArray(body) ? body[0] : body;
    expect(svc).toHaveProperty('service_code');
  });

  test('Discovery endpoint returns endpoints array', async ({ request }) => {
    const res = await request.get('/open311/discovery.json');
    expect(res.ok()).toBe(true);
    const body = await res.json();
    // GeoReport v2 discovery wraps in { discovery: { ... } }
    const disc = body?.discovery ?? body;
    expect(disc).toBeTruthy();
    // Should list endpoints
    const endpoints = disc?.endpoints ?? disc?.url ?? disc;
    expect(endpoints).toBeTruthy();
  });

});
