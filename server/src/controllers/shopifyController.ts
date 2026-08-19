import { Request, Response, NextFunction } from 'express';
import { ShopifyService } from '../services/shopifyService.js';
import { getAuthContext } from '../middleware/auth.js';
import { sendSuccess } from '../utils/apiResponse.js';

export class ShopifyController {
  static async getShop(req: Request, res: Response, next: NextFunction) {
    try {
      const { shopDomain } = getAuthContext(req);
      const accessToken = res.locals.shopify?.session?.accessToken;
      const shop = await ShopifyService.getShopInfo(shopDomain, accessToken);
      sendSuccess(res, shop);
    } catch (error) {
      next(error);
    }
  }

  static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { shopDomain } = getAuthContext(req);
      const accessToken = res.locals.shopify?.session?.accessToken;
      const products = await ShopifyService.getProducts(shopDomain, 50, accessToken);
      sendSuccess(res, products);
    } catch (error) {
      next(error);
    }
  }
}
