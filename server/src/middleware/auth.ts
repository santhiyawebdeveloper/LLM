import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { IStore } from '../models/Store.js';
import { StoreService } from '../services/storeService.js';
import { UnauthorizedError } from '../utils/errors.js';

export interface AuthenticatedRequest extends Request {
  store: IStore;
  storeId: Types.ObjectId;
  shopDomain: string;
}

export async function syncStoreMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = res.locals.shopify?.session;
    if (!session?.shop || !session?.accessToken) {
      throw new UnauthorizedError();
    }

    const store = await StoreService.syncFromSession(
      session.shop,
      session.accessToken,
      session.scope || ''
    );

    (req as AuthenticatedRequest).store = store;
    (req as AuthenticatedRequest).storeId = store._id;
    (req as AuthenticatedRequest).shopDomain = session.shop;

    next();
  } catch (error) {
    next(error);
  }
}

export function getAuthContext(req: Request): {
  store: IStore;
  storeId: Types.ObjectId;
  shopDomain: string;
} {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.store || !authReq.storeId) {
    throw new UnauthorizedError();
  }
  return {
    store: authReq.store,
    storeId: authReq.storeId,
    shopDomain: authReq.shopDomain,
  };
}
