import './dns.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnvPath = path.resolve(__dirname, '../../../.env');

dotenv.config({ path: rootEnvPath });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  SHOPIFY_API_KEY: z.string().min(1),
  SHOPIFY_API_SECRET: z.string().min(1),
  SHOPIFY_APP_URL: z.string().url(),
  SHOPIFY_SCOPES: z.string().default('read_products'),
  MONGODB_URI: z.string().min(1),
});

function loadEnv() {
  if (process.env.NODE_ENV === 'test') {
    return {
      NODE_ENV: 'test' as const,
      PORT: 3001,
      SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY || 'test-api-key',
      SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET || 'test-api-secret',
      SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL || 'http://localhost:3001',
      SHOPIFY_SCOPES: process.env.SHOPIFY_SCOPES || 'read_products',
      MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/test',
    };
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.errors.map((e) => e.path.join('.')).join(', ');
    throw new Error(`Missing or invalid environment variables: ${missing}`);
  }
  return parsed.data;
}

export const env = loadEnv();
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
