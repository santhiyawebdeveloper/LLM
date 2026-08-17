import type { Express } from 'express';
import type { IncomingMessage, ServerResponse } from 'http';

type VercelRequest = IncomingMessage & { query?: Record<string, string | string[]> };
type VercelResponse = ServerResponse;

let appPromise: Promise<Express> | undefined;

async function getApp(): Promise<Express> {
  if (!appPromise) {
    appPromise = (async () => {
      const { connectDatabase } = await import('../server/dist/config/database.js');
      const { createApp } = await import('../server/dist/app.js');
      await connectDatabase();
      return createApp();
    })();
  }
  return appPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await getApp();
  return app(req, res);
}
