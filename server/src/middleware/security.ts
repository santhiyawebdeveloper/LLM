import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { isProduction } from '../config/env.js';

/**
 * Security headers compatible with Shopify embedded apps (iframe in Admin).
 * frameguard and strict CSP are disabled so App Bridge can load inside Shopify.
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  frameguard: false,
});

const authWindowMs = 15 * 60 * 1000;
const apiWindowMs = 15 * 60 * 1000;

export const authRateLimiter = rateLimit({
  windowMs: authWindowMs,
  max: isProduction ? 30 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
    code: 'RATE_LIMITED',
  },
});

export const apiRateLimiter = rateLimit({
  windowMs: apiWindowMs,
  max: isProduction ? 300 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    code: 'RATE_LIMITED',
  },
});

export const healthRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isProduction ? 60 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    code: 'RATE_LIMITED',
  },
});
