import { Request, Response, NextFunction } from 'express';
import { RequestedTokenType } from '@shopify/shopify-api';
import { shopifyAppInstance } from '../config/shopifyApp.js';
import { env } from '../config/env.js';
import { sendError } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';
import {
  getSessionToken,
  resolveShopFromRequest,
} from './bootstrapOfflineSession.js';
import { isValidShopDomain } from '../utils/shopifyParams.js';

async function loadOrCreateOfflineSession(
  req: Request,
  res: Response
): Promise<{ shop: string; session: Awaited<ReturnType<typeof shopifyAppInstance.config.sessionStorage.loadSession>> } | null> {
  const sessionToken = getSessionToken(req);
  const shop = await resolveShopFromRequest(req, sessionToken);

  if (!shop) {
    return null;
  }

  const sessionId = shopifyAppInstance.api.session.getOfflineId(shop);
  let session = await shopifyAppInstance.config.sessionStorage.loadSession(sessionId);

  if (sessionToken) {
    try {
      const { session: exchanged } = await shopifyAppInstance.api.auth.tokenExchange({
        shop,
        sessionToken,
        requestedTokenType: RequestedTokenType.OfflineAccessToken,
      });
      await shopifyAppInstance.config.sessionStorage.storeSession(exchanged);
      session = exchanged;
      logger.info('Refreshed offline session via token exchange', { shop });
    } catch (error) {
      logger.warn('Token exchange failed', {
        shop,
        message: error instanceof Error ? error.message : String(error),
      });
      if (!session?.accessToken) {
        return null;
      }
    }
  } else if (!session?.accessToken) {
    return null;
  }

  if (!session?.accessToken) {
    return null;
  }

  res.locals.shopify = {
    ...res.locals.shopify,
    session,
  };

  return { shop, session };
}

/** API routes: require Bearer session token and an offline shop session. */
export async function requireOfflineShopSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await loadOrCreateOfflineSession(req, res);
    if (!result) {
      sendError(
        res,
        'Install or reopen the app from Shopify Admin (Apps → LMS).',
        'UNAUTHORIZED',
        401
      );
      return;
    }
    next();
  } catch (error) {
    logger.error('Offline session validation failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    sendError(
      res,
      'Authentication failed. Reopen the app from Shopify Admin.',
      'UNAUTHORIZED',
      401
    );
  }
}

function redirectToManagedInstall(req: Request, res: Response, shop: string): void {
  const installPath = `/install?shop=${encodeURIComponent(shop)}`;
  const installUrl = `${env.SHOPIFY_APP_URL}${installPath}`;

  if (req.query.embedded === '1') {
    const queryParams = new URLSearchParams({
      shop,
      redirectUri: installUrl,
    }).toString();
    res.redirect(`${shopifyAppInstance.config.exitIframePath}?${queryParams}`);
    return;
  }

  res.redirect(installPath);
}

/** SPA routes: bootstrap session or send the merchant to managed install (not legacy OAuth). */
export async function ensureInstalledForSpa(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const shopParam =
      typeof req.query.shop === 'string'
        ? req.query.shop
        : req.cookies?.shopify_shop;

    if (!shopParam || !isValidShopDomain(shopParam)) {
      next();
      return;
    }

    const result = await loadOrCreateOfflineSession(req, res);
    if (!result) {
      redirectToManagedInstall(req, res, shopParam);
      return;
    }

    next();
  } catch (error) {
    logger.error('SPA install check failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    next(error);
  }
}
