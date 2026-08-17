import './dns.js';
import { env, isTest } from './env.js';
import '@shopify/shopify-api/adapters/node';
import { ApiVersion } from '@shopify/shopify-api';
import { shopifyApp } from '@shopify/shopify-app-express';
import { MongoDBSessionStorage } from '@shopify/shopify-app-session-storage-mongodb';
import { MemorySessionStorage } from '@shopify/shopify-app-session-storage-memory';

function getDatabaseName(uri: string): string {
  const dbNameMatch = uri.match(/\/([^/?]+)(\?|$)/);
  return dbNameMatch?.[1] || 'shopify_lms';
}

function createSessionStorage(): MongoDBSessionStorage | MemorySessionStorage {
  if (isTest) {
    return new MemorySessionStorage();
  }

  const uri = env.MONGODB_URI;
  const dbName = getDatabaseName(uri);

  if (uri.startsWith('mongodb+srv://')) {
    const url = new URL(uri);
    return new MongoDBSessionStorage(url, dbName);
  }

  const match = uri.match(/^mongodb:\/\/([^:]+):([^@]+)@([^/]+)\//);
  if (!match) {
    throw new Error('Invalid MONGODB_URI format for MongoDB session storage');
  }

  const [, username, password, hosts] = match;
  const firstHost = hosts.split(',')[0];

  return MongoDBSessionStorage.withCredentials(
    firstHost,
    dbName,
    decodeURIComponent(username),
    decodeURIComponent(password),
    {},
  );
}

export const shopifyAppInstance = shopifyApp({
  api: {
    apiKey: env.SHOPIFY_API_KEY,
    apiSecretKey: env.SHOPIFY_API_SECRET,
    scopes: env.SHOPIFY_SCOPES.split(',').map((s) => s.trim()),
    hostName: new URL(env.SHOPIFY_APP_URL).host,
    apiVersion: ApiVersion.January25,
    isEmbeddedApp: true,
  },
  auth: {
    path: '/api/auth',
    callbackPath: '/api/auth/callback',
  },
  webhooks: {
    path: '/api/webhooks',
  },
  sessionStorage: createSessionStorage(),
  useOnlineTokens: false,
});
