import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/dashboard/stats', () =>
    HttpResponse.json({
      open: 42,
      openedToday: 5,
      closedToday: 3,
      overdue: 7,
    })
  ),

  http.get('/api/dashboard/chart', () =>
    HttpResponse.json([
      { status: 'open', count: 42 },
      { status: 'closed', count: 120 },
    ])
  ),

  http.get('/api/geoclusters', () =>
    HttpResponse.json({
      type: 'FeatureCollection',
      features: [],
    })
  ),

  http.get('/api/tickets', () =>
    HttpResponse.json({
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
    })
  ),
];
