import express, { Express } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { DeliveryMethod } from '@shopify/shopify-api';
import { shopifyAppInstance } from './config/shopifyApp.js';
import { syncStoreMiddleware } from './middleware/auth.js';
import { requireBearerAuth } from './middleware/requireBearerAuth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { env, isProduction } from './config/env.js';
import { StoreService } from './services/storeService.js';
import { logger } from './utils/logger.js';

import courseRoutes from './routes/courseRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import shopifyRoutes from './routes/shopifyRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(): Express {
  const app = express();

  app.use(cors({
    origin: isProduction ? env.SHOPIFY_APP_URL : true,
    credentials: true,
  }));

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, message: 'Server is running' });
  });

  app.get(shopifyAppInstance.config.auth.path, shopifyAppInstance.auth.begin());
  app.get(
    shopifyAppInstance.config.auth.callbackPath,
    shopifyAppInstance.auth.callback(),
    shopifyAppInstance.redirectToShopifyOrAppRoot()
  );

  app.post(
    shopifyAppInstance.config.webhooks.path,
    ...shopifyAppInstance.processWebhooks({
      webhookHandlers: {
        APP_UNINSTALLED: {
          deliveryMethod: DeliveryMethod.Http,
          callbackUrl: shopifyAppInstance.config.webhooks.path,
          callback: async (_topic, shop) => {
            logger.info(`App uninstalled for shop: ${shop}`);
            await StoreService.removeByShopDomain(shop);
          },
        },
      },
    })
  );

  const protectedApi = express.Router();
  protectedApi.use(requireBearerAuth);
  protectedApi.use(shopifyAppInstance.validateAuthenticatedSession());
  protectedApi.use(syncStoreMiddleware);

  protectedApi.use('/courses', courseRoutes);
  protectedApi.use('/students', studentRoutes);
  protectedApi.use('/enrollments', enrollmentRoutes);
  protectedApi.use('/dashboard', dashboardRoutes);
  protectedApi.use('/shopify', shopifyRoutes);

  app.use('/api', protectedApi);

  const clientDistPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDistPath));

  app.get('*', shopifyAppInstance.ensureInstalledOnShop(), (_req, res, next) => {
    res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
      if (err) next(err);
    });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
