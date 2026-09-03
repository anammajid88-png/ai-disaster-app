'use strict';

const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');

const config = require('./config/env');
const logger = require('./utils/logger');
const apiRoutes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

/**
 * Express application factory.
 *
 * Kept separate from server.js so the same app can be mounted by a serverless
 * handler (api/index.js on Vercel) or listened on directly in development.
 */
function createApp() {
  const app = express();

  // Behind Vercel / any proxy, so req.ip reflects the real client for rate limiting.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          // Vite injects a small inline style block; SVG illustrations use data: URIs.
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          scriptSrc: ["'self'"],
          // The browser only ever talks to our own origin - never to Model Studio.
          connectSrc: ["'self'"],
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      // Allows the manifest/icons to load normally when installed as a PWA.
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
  );

  app.use(compression());

  // In development the Vite dev server runs on another port, so CORS is needed.
  // In production the client is served from this same origin and the allow-list
  // stays empty, which blocks other websites from using our AI quota.
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.corsOrigins.length === 0 || config.corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      methods: ['GET', 'POST'],
      maxAge: 86_400,
    })
  );

  app.use(express.json({ limit: '32kb' }));

  app.use('/api', apiRoutes);
  app.use('/api', notFound);

  // Serve the built client when it exists (production / `npm run build`).
  const clientDist = path.resolve(__dirname, '..', 'client', 'dist');
  if (fs.existsSync(path.join(clientDist, 'index.html'))) {
    app.use(
      express.static(clientDist, {
        setHeaders(res, filePath) {
          if (filePath.endsWith('service-worker.js') || filePath.endsWith('index.html')) {
            res.setHeader('Cache-Control', 'no-cache');
          } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      })
    );

    // SPA history fallback for React Router.
    app.get('*', (req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  } else {
    app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'AI Disaster App API is running. Start the client with "npm run dev".',
        endpoints: ['/api/health', '/api/chat', '/api/content/disasters'],
      });
    });
  }

  app.use(errorHandler);

  if (!config.ai.isConfigured) {
    logger.warn(
      '[startup] Qwen credentials missing or placeholder - /api/chat will answer from local fallback guidance.'
    );
  }

  return app;
}

module.exports = createApp;
