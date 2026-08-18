import { Request, Response, NextFunction } from 'express';
import { shopifyAppInstance } from '../config/shopifyApp.js';
import { env } from '../config/env.js';
import { isValidShopDomain, isValidShopifyHost } from '../utils/shopifyParams.js';

/**
 * After OAuth callback, send the merchant into Shopify Admin.
 * Direct install links (/api/auth?shop=...) do not include a host param, so the
 * default shopify-app-express redirect fails; fall back to the admin apps URL.
 */
export async function redirectAfterOAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (res.headersSent) {
    return;
  }

  const session = res.locals.shopify?.session as { shop?: string } | undefined;
  if (!session?.shop || !isValidShopDomain(session.shop)) {
    next();
    return;
  }

  try {
    const host = typeof req.query.host === 'string' ? req.query.host : undefined;

    if (host && isValidShopifyHost(host)) {
      const redirectUrl = await shopifyAppInstance.api.auth.getEmbeddedAppUrl({
        rawRequest: req,
        rawResponse: res,
      });
      res.redirect(redirectUrl);
      return;
    }

    res.redirect(`https://${session.shop}/admin/apps/${env.SHOPIFY_API_KEY}`);
  } catch (err) {
    next(err);
  }
}
