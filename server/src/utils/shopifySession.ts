import { Session } from '@shopify/shopify-api';
import { shopifyAppInstance } from '../config/shopifyApp.js';

export function createOfflineSession(shop: string, accessToken: string): Session {
  return Session.fromPropertyArray([
    ['id', `offline_${shop}`],
    ['shop', shop],
    ['state', ''],
    ['isOnline', false],
    ['accessToken', accessToken],
  ]);
}

export function createGraphqlClient(shop: string, accessToken: string) {
  return new shopifyAppInstance.api.clients.Graphql({
    session: createOfflineSession(shop, accessToken),
  });
}
