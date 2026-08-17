import { Types } from 'mongoose';
import { Store, IStore } from '../models/Store.js';
import { Course } from '../models/Course.js';
import { Student } from '../models/Student.js';
import { Enrollment } from '../models/Enrollment.js';
import { createGraphqlClient } from '../utils/shopifySession.js';
import { ShopifyApiError } from '../utils/errors.js';

export class StoreService {
  static async syncFromSession(
    shopDomain: string,
    accessToken: string,
    scopes: string
  ): Promise<IStore> {
    let shopName = shopDomain;

    try {
      const client = createGraphqlClient(shopDomain, accessToken);

      const response = await client.request<{ shop: { name: string } }>(
        `query { shop { name } }`
      );

      if (response.data?.shop?.name) {
        shopName = response.data.shop.name;
      }
    } catch {
      // Use shop domain as fallback name if GraphQL fails during sync
    }

    const store = await Store.findOneAndUpdate(
      { shopDomain: shopDomain.toLowerCase() },
      {
        shopDomain: shopDomain.toLowerCase(),
        shopName,
        shopifyAccessToken: accessToken,
        scopes,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return store;
  }

  static async removeAllStoreData(storeId: Types.ObjectId): Promise<void> {
    await Promise.all([
      Enrollment.deleteMany({ storeId }),
      Student.deleteMany({ storeId }),
      Course.deleteMany({ storeId }),
    ]);
  }

  static async removeByShopDomain(shopDomain: string): Promise<void> {
    const store = await Store.findOne({ shopDomain: shopDomain.toLowerCase() });
    if (!store) return;

    await StoreService.removeAllStoreData(store._id);
    await Store.findOneAndDelete({ _id: store._id });
  }

  static async getAccessToken(shopDomain: string): Promise<string> {
    const store = await Store.findOne({ shopDomain: shopDomain.toLowerCase() })
      .select('+shopifyAccessToken');

    if (!store?.shopifyAccessToken) {
      throw new ShopifyApiError('Store access token not found');
    }

    return store.shopifyAccessToken;
  }
}
