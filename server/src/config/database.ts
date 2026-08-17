import mongoose from 'mongoose';
import { env, isTest } from './env.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  if (isConnected) return;

  const uri = isTest
    ? process.env.MONGODB_URI || env.MONGODB_URI
    : env.MONGODB_URI;

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(uri);
    isConnected = true;
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection failed', error);
    throw error;
  }

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error', err);
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    logger.warn('MongoDB disconnected');
  });
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
}

export { mongoose };
