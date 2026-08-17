import './config/dns.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

async function startServer(): Promise<void> {
  try {
    // Connect Mongoose before loading Shopify app modules so MongoDB session
    // storage does not race a second connection during module initialization.
    await connectDatabase();

    const { createApp } = await import('./app.js');
    const app = createApp();

    app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

startServer();
