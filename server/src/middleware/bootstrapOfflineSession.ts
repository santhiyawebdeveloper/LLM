import { Request, Response, NextFunction } from 'express';
import { RequestedTokenType } from '@shopify/shopify-api';
import { shopifyAppInstance } from '../config/shopifyApp.js';
import { isValidShopDomain } from '../utils/shopifyParams.js';
import { logger } from '../utils/logger.js';

function getSessionToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length).trim();
    if (token) {
      return token;
    }
  }

  const idToken = req.query.id_token;
  return typeof idToken === 'string' && idToken.length > 0 ? idToken : undefined;
}

/**
 * After Shopify managed installation there may be no offline session in storage yet.
 * Exchange the embedded session token for an offline access token on first request.
 */
export async function bootstrapOfflineSession(
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

    const shop = shopifyAppInstance.api.utils.sanitizeShop(shopParam);
    if (!shop) {
      next();
      return;
    }

    const sessionId = shopifyAppInstance.api.session.getOfflineId(shop);
    const existing = await shopifyAppInstance.config.sessionStorage.loadSession(sessionId);
    if (existing?.accessToken) {
      res.locals.shopify = {
        ...res.locals.shopify,
        session: existing,
      };
      next();
      return;
    }

    const sessionToken = getSessionToken(req);
    if (!sessionToken) {
      next();
      return;
    }

    const { session } = await shopifyAppInstance.api.auth.tokenExchange({
      shop,
      sessionToken,
      requestedTokenType: RequestedTokenType.OfflineAccessToken,
    });

    await shopifyAppInstance.config.sessionStorage.storeSession(session);
    res.locals.shopify = {
      ...res.locals.shopify,
      session,
    };

    logger.info('Bootstrapped offline session via token exchange', { shop });
    next();
  } catch (error) {
    logger.warn('Token exchange bootstrap skipped', {
      message: error instanceof Error ? error.message : String(error),
    });
    next();
  }
}

export function getShopifyInstallUrl(apiKey: string, shop?: string): string {
  if (shop) {
    return `https://${shop}/admin/oauth/install?client_id=${encodeURIComponent(apiKey)}`;
  }
  return `https://admin.shopify.com/oauth/install?client_id=${encodeURIComponent(apiKey)}`;
}
