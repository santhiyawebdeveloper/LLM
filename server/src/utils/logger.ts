import { env, isProduction } from '../config/env.js';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function log(level: LogLevel, message: string, meta?: unknown): void {
  if (isProduction && level === 'debug') return;

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  if (meta !== undefined) {
    console[level === 'debug' ? 'log' : level](`${prefix} ${message}`, meta);
  } else {
    console[level === 'debug' ? 'log' : level](`${prefix} ${message}`);
  }
}

export const logger = {
  info: (message: string, meta?: unknown) => log('info', message, meta),
  warn: (message: string, meta?: unknown) => log('warn', message, meta),
  error: (message: string, meta?: unknown) => log('error', message, meta),
  debug: (message: string, meta?: unknown) => {
    if (env.NODE_ENV === 'development') log('debug', message, meta);
  },
};
