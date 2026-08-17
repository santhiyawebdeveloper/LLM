import { Request, Response, NextFunction } from 'express';
import { ShopifyService } from '../services/shopifyService.js';
import { getAuthContext } from '../middleware/auth.js';
import { sendSuccess } from '../utils/apiResponse.js';

export class ShopifyController {
  static async getShop(req: Request, res: Response, next: NextFunction) {
    try {
      const { shopDomain } = getAuthContext(req);
      const shop = await ShopifyService.getShopInfo(shopDomain);
      sendSuccess(res, shop);
    } catch (error) {
      next(error);
    }
  }

  static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { shopDomain } = getAuthContext(req);
      const products = await ShopifyService.getProducts(shopDomain);
      sendSuccess(res, products);
    } catch (error) {
      next(error);
    }
  }
}
