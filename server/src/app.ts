import express, { Express } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { DeliveryMethod } from '@shopify/shopify-api';
import { shopifyAppInstance } from './config/shopifyApp.js';
import { syncStoreMiddleware } from './middleware/auth.js';
import { requireBearerAuth } from './middleware/requireBearerAuth.js';
import {
  securityHeaders,
  authRateLimiter,
  apiRateLimiter,
  healthRateLimiter,
} from './middleware/security.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { env, isProduction } from './config/env.js';
import { StoreService } from './services/storeService.js';
import { logger } from './utils/logger.js';
import { isValidShopDomain, isValidShopifyHost } from './utils/shopifyParams.js';

import courseRoutes from './routes/courseRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import shopifyRoutes from './routes/shopifyRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(): Express {
  const app = express();

  app.use(securityHeaders);

  app.use(cors({
    origin: isProduction ? env.SHOPIFY_APP_URL : true,
    credentials: true,
  }));

  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.use((req, res, next) => {
    const shop = req.query.shop;
    const host = req.query.host;
    const cookieOpts = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ('none' as const) : ('lax' as const),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    if (typeof shop === 'string' && isValidShopDomain(shop)) {
      res.cookie('shopify_shop', shop, cookieOpts);
    }
    if (typeof host === 'string' && isValidShopifyHost(host)) {
      res.cookie('shopify_host', host, cookieOpts);
    }
    next();
  });

  app.get('/api/health', healthRateLimiter, (_req, res) => {
    res.json({ success: true, message: 'Server is running' });
  });

  app.get(
    shopifyAppInstance.config.auth.path,
    authRateLimiter,
    shopifyAppInstance.auth.begin()
  );
  app.get(
    shopifyAppInstance.config.auth.callbackPath,
    authRateLimiter,
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
  protectedApi.use(apiRateLimiter);
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

  app.get('*', (req, _res, next) => {
    const shopCookie = req.cookies?.shopify_shop;
    const hostCookie = req.cookies?.shopify_host;

    if (!req.query.shop && typeof shopCookie === 'string' && isValidShopDomain(shopCookie)) {
      req.query.shop = shopCookie;
    }
    if (!req.query.host && typeof hostCookie === 'string' && isValidShopifyHost(hostCookie)) {
      req.query.host = hostCookie;
    }
    next();
  }, shopifyAppInstance.ensureInstalledOnShop(), (_req, res, next) => {
    res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
      if (err) next(err);
    });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
