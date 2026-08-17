import express, { Express } from 'express';
import { Session } from '@shopify/shopify-api';
import { requireBearerAuth } from '../../middleware/requireBearerAuth.js';
import { syncStoreMiddleware } from '../../middleware/auth.js';
import { errorHandler } from '../../middleware/errorHandler.js';

import courseRoutes from '../../routes/courseRoutes.js';
import studentRoutes from '../../routes/studentRoutes.js';
import enrollmentRoutes from '../../routes/enrollmentRoutes.js';
import dashboardRoutes from '../../routes/dashboardRoutes.js';
import shopifyRoutes from '../../routes/shopifyRoutes.js';

const TEST_SHOP = 'test-shop.myshopify.com';
const OTHER_TEST_SHOP = 'other-test-shop.myshopify.com';

/**
 * API app for HTTP tests that require an authenticated tenant context.
 * Uses real requireBearerAuth, syncStoreMiddleware, routes, and error handling.
 * Shopify JWT/session validation is simulated with a stored offline session
 * because the Shopify session storage DB is initialized before test MongoDB boots.
 */
export function createAuthenticatedApiApp(shop = TEST_SHOP): Express {
  const app = express();
  app.use(express.json());

  const api = express.Router();
  api.use(requireBearerAuth);
  api.use(async (req, res, next) => {
    res.locals.shopify = {
      session: Session.fromPropertyArray([
        ['id', `offline_${shop}`],
        ['shop', shop],
        ['state', ''],
        ['isOnline', false],
        ['accessToken', 'shpat_test_access_token'],
        ['scope', 'read_products'],
      ]),
    };
    await syncStoreMiddleware(req, res, next);
  });

  api.use('/courses', courseRoutes);
  api.use('/students', studentRoutes);
  api.use('/enrollments', enrollmentRoutes);
  api.use('/dashboard', dashboardRoutes);
  api.use('/shopify', shopifyRoutes);

  app.use('/api', api);
  app.use(errorHandler);

  return app;
}

export const TEST_BEARER = 'Bearer test-session-token';
export { OTHER_TEST_SHOP };
