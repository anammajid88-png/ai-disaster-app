'use strict';

/**
 * Vercel serverless entry point.
 *
 * vercel.json rewrites every /api/* request here, and the Express app handles
 * the routing internally. The API key is read from Vercel's encrypted
 * environment variables at runtime - it is never part of the client bundle.
 */
const createApp = require('../server/app');

module.exports = createApp();
