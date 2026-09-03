'use strict';

const config = require('./config/env');
const logger = require('./utils/logger');
const createApp = require('./app');

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info(`[startup] AI Disaster App API listening on http://localhost:${config.port}`);
  logger.info(
    `[startup] environment=${config.nodeEnv} ai=${config.ai.isConfigured ? `${config.ai.provider} (${config.ai.model})` : 'local fallback only'}`
  );
});

const shutdown = (signal) => {
  logger.info(`[shutdown] ${signal} received, closing server.`);
  server.close(() => process.exit(0));
  // Do not hang forever if a request is stuck.
  setTimeout(() => process.exit(1), 5000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.error('[fatal] Unhandled promise rejection:', reason);
});
