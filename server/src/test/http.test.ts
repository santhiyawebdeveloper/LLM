import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import {
  createAuthenticatedApiApp,
  TEST_BEARER,
  OTHER_TEST_SHOP,
} from './helpers/testApp.js';
import { CourseStatus } from '../models/Course.js';

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

    it('GET /api/courses with invalid Bearer token format returns 401', async () => {
      const res = await request(app)
        .get('/api/courses')
        .set('Authorization', 'Bearer');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('GET /health returns ok without authentication', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('GET /api/health returns running message without authentication', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Server is running');
    });

    it('GET /dashboard without Shopify shop context serves SPA', async () => {
      const res = await request(app).get('/dashboard');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
    });

    it('GET /exitiframe without redirectUri returns 400', async () => {
      const res = await request(app).get('/exitiframe');
      expect(res.status).toBe(400);
    });

    it('GET /exitiframe with app redirectUri returns breakout HTML', async () => {
      const redirectUri = encodeURIComponent(
        'http://localhost:3001/api/auth?shop=test.myshopify.com'
      );
      const res = await request(app).get(`/exitiframe?redirectUri=${redirectUri}`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
      expect(res.text).toContain("window.open(");
      expect(res.text).toContain('_top');
    });

    it('GET /install redirects to Shopify managed install URL', async () => {
      const res = await request(app).get('/install?shop=test.myshopify.com');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe(
        'https://test.myshopify.com/admin/oauth/install?client_id=test-api-key'
      );
    });

    it('GET /install without shop redirects to admin install URL', async () => {
      const res = await request(app).get('/install');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe(
        'https://admin.shopify.com/oauth/install?client_id=test-api-key'
      );
    });

    it('GET /api/auth?shop= redirects to managed install (not legacy OAuth)', async () => {
      const res = await request(app).get('/api/auth?shop=test.myshopify.com');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/install?shop=test.myshopify.com');
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

  describe('cross-tenant access (authenticated tenant pipeline)', () => {
    it('store B cannot GET store A course by id', async () => {
      const storeAApp = createAuthenticatedApiApp();
      const storeBApp = createAuthenticatedApiApp(OTHER_TEST_SHOP);

      const createRes = await request(storeAApp)
        .post('/api/courses')
        .set('Authorization', TEST_BEARER)
        .send({
          title: 'Store A Only Course',
          description: 'Cross-tenant test course',
          instructorName: 'Instructor',
          category: 'Test',
          duration: 5,
          status: CourseStatus.ACTIVE,
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      const courseId = createRes.body.data._id;

      const crossRes = await request(storeBApp)
        .get(`/api/courses/${courseId}`)
        .set('Authorization', TEST_BEARER);

      expect(crossRes.status).toBe(404);
      expect(crossRes.body.success).toBe(false);
      expect(crossRes.body.code).toBe('COURSE_NOT_FOUND');
    });

    it('store B cannot GET store A student by id', async () => {
      const storeAApp = createAuthenticatedApiApp();
      const storeBApp = createAuthenticatedApiApp(OTHER_TEST_SHOP);

      const createRes = await request(storeAApp)
        .post('/api/students')
        .set('Authorization', TEST_BEARER)
        .send({
          name: 'Store A Student',
          email: 'store-a-student@example.com',
        });

      expect(createRes.status).toBe(201);
      const studentId = createRes.body.data._id;

      const crossRes = await request(storeBApp)
        .get(`/api/students/${studentId}`)
        .set('Authorization', TEST_BEARER);

      expect(crossRes.status).toBe(404);
      expect(crossRes.body.code).toBe('STUDENT_NOT_FOUND');
    });

    it('store B cannot GET store A enrollment by id', async () => {
      const storeAApp = createAuthenticatedApiApp();
      const storeBApp = createAuthenticatedApiApp(OTHER_TEST_SHOP);

      const courseRes = await request(storeAApp)
        .post('/api/courses')
        .set('Authorization', TEST_BEARER)
        .send({
          title: 'Enrollment Isolation Course',
          description: 'Desc',
          instructorName: 'Inst',
          category: 'Test',
          duration: 5,
        });

      const studentRes = await request(storeAApp)
        .post('/api/students')
        .set('Authorization', TEST_BEARER)
        .send({
          name: 'Enrollment Student',
          email: 'enrollment-student@example.com',
        });

      const enrollmentRes = await request(storeAApp)
        .post('/api/enrollments')
        .set('Authorization', TEST_BEARER)
        .send({
          studentId: studentRes.body.data._id,
          courseId: courseRes.body.data._id,
        });

      expect(enrollmentRes.status).toBe(201);
      const enrollmentId = enrollmentRes.body.data._id;

      const crossRes = await request(storeBApp)
        .get(`/api/enrollments/${enrollmentId}`)
        .set('Authorization', TEST_BEARER);

      expect(crossRes.status).toBe(404);
      expect(crossRes.body.code).toBe('ENROLLMENT_NOT_FOUND');
    });
  });
});
