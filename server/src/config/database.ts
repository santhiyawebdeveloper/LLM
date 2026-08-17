import mongoose from 'mongoose';
import { env, isTest } from './env.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

declare global {
  // Reuse Mongoose connection across Vercel serverless invocations.
  // eslint-disable-next-line no-var
  var __mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

const globalCache = global.__mongooseCache || { conn: null, promise: null };
global.__mongooseCache = globalCache;

export async function connectDatabase(): Promise<void> {
  if (globalCache.conn?.connection?.readyState === 1) {
    isConnected = true;
    return;
  }

  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  const uri = isTest
    ? process.env.MONGODB_URI || env.MONGODB_URI
    : env.MONGODB_URI;

  mongoose.set('strictQuery', true);

  try {
    if (!globalCache.promise) {
      globalCache.promise = mongoose.connect(uri).then((m) => {
        globalCache.conn = m;
        return m;
      });
    }
    await globalCache.promise;
    isConnected = true;
    logger.info('MongoDB connected successfully');
  } catch (error) {
    globalCache.promise = null;
    logger.error('MongoDB connection failed', error);
    throw error;
  }

  mongoose.connection.on('error', (err) => {
    isConnected = false;
    logger.error('MongoDB connection error', err);
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    globalCache.conn = null;
    globalCache.promise = null;
    logger.warn('MongoDB disconnected');
  });
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
}

export { mongoose };
