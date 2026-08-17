import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createAuthenticatedApiApp, TEST_BEARER } from './helpers/testApp.js';

describe('HTTP API integration', () => {
  describe('unauthenticated requests (full app pipeline)', () => {
    let app: import('express').Express;

    beforeAll(async () => {
      const { createApp } = await import('../app.js');
      app = createApp();
    });

    it('GET /api/courses without authentication returns 401', async () => {
      const res = await request(app).get('/api/courses');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('GET /api/students without authentication returns 401', async () => {
      const res = await request(app).get('/api/students');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('GET /api/enrollments without authentication returns 401', async () => {
      const res = await request(app).get('/api/enrollments');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('GET /api/dashboard/summary without authentication returns 401', async () => {
      const res = await request(app).get('/api/dashboard/summary');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('invalid route params (authenticated tenant pipeline)', () => {
    let app: import('express').Express;

    beforeAll(() => {
      app = createAuthenticatedApiApp();
    });

    it('GET /api/courses/invalid-id returns 400', async () => {
      const res = await request(app)
        .get('/api/courses/invalid-id')
        .set('Authorization', TEST_BEARER);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVALID_ID');
    });

    it('GET /api/students/invalid-id returns 400', async () => {
      const res = await request(app)
        .get('/api/students/invalid-id')
        .set('Authorization', TEST_BEARER);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_ID');
    });

    it('PATCH /api/courses/invalid-id returns 400', async () => {
      const res = await request(app)
        .patch('/api/courses/invalid-id')
        .set('Authorization', TEST_BEARER)
        .send({ title: 'Updated' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_ID');
    });
  });
});
