import { StoreService } from './storeService.js';
import { ShopifyApiError } from '../utils/errors.js';
import { createGraphqlClient } from '../utils/shopifySession.js';
import { logger } from '../utils/logger.js';

const SHOP_QUERY = `
  query {
    shop {
      id
      name
      email
      myshopifyDomain
    }
  }
`;

const PRODUCTS_QUERY = `
  query getProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          status
        }
      }
    }
  }
`;

function getGraphqlErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export class ShopifyService {
  static async getShopInfo(shopDomain: string, accessToken?: string) {
    try {
      const token = accessToken ?? await StoreService.getAccessToken(shopDomain);
      const client = createGraphqlClient(shopDomain, token);
      const response = await client.request<{
        shop: {
          id: string;
          name: string;
          email: string;
          myshopifyDomain: string;
        };
      }>(SHOP_QUERY);

      if (!response.data?.shop) {
        throw new ShopifyApiError('Failed to retrieve shop information');
      }

      return response.data.shop;
    } catch (error) {
      if (error instanceof ShopifyApiError) throw error;
      logger.error('Shopify shop GraphQL request failed', {
        shopDomain,
        message: getGraphqlErrorMessage(error),
      });
      throw new ShopifyApiError('Failed to retrieve shop information from Shopify');
    }
  }

  static async getProducts(shopDomain: string, first = 50, accessToken?: string) {
    try {
      const token = accessToken ?? await StoreService.getAccessToken(shopDomain);
      const client = createGraphqlClient(shopDomain, token);
      const response = await client.request<{
        products: {
          edges: Array<{
            node: {
              id: string;
              title: string;
              status: string;
            };
          }>;
        };
      }>(PRODUCTS_QUERY, { variables: { first } });

      if (!response.data?.products) {
        throw new ShopifyApiError('Failed to retrieve products');
      }

      return response.data.products.edges.map((edge) => edge.node);
    } catch (error) {
      if (error instanceof ShopifyApiError) throw error;
      logger.error('Shopify products GraphQL request failed', {
        shopDomain,
        message: getGraphqlErrorMessage(error),
      });
      throw new ShopifyApiError('Failed to retrieve products from Shopify');
    }
  }
}
