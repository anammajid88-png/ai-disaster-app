'use strict';

const express = require('express');
const {
  disasters,
  disastersById,
  emergencyContacts,
  emergencyKit,
} = require('../../shared/data/index.cjs');

const router = express.Router();

/**
 * Read-only safety content endpoints.
 *
 * The client bundles the same JSON so every screen works offline; these routes
 * exist so the content can later be updated server-side (or consumed by
 * another client) without shipping a new frontend build.
 */

// Safety content never changes within a deployment - let the browser cache it.
const CACHE_ONE_HOUR = 'public, max-age=3600';

router.get('/disasters', (req, res) => {
  res.set('Cache-Control', CACHE_ONE_HOUR);
  res.json({ success: true, count: disasters.length, disasters });
});

router.get('/disasters/:id', (req, res) => {
  const disaster = disastersById[req.params.id];
  if (!disaster) {
    return res.status(404).json({
      success: false,
      error: { code: 'DISASTER_NOT_FOUND', messageKey: 'errors.notFound' },
    });
  }
  res.set('Cache-Control', CACHE_ONE_HOUR);
  return res.json({ success: true, disaster });
});

router.get('/emergency-contacts', (req, res) => {
  res.set('Cache-Control', CACHE_ONE_HOUR);
  res.json({ success: true, ...emergencyContacts });
});

router.get('/emergency-kit', (req, res) => {
  res.set('Cache-Control', CACHE_ONE_HOUR);
  res.json({ success: true, ...emergencyKit });
});

module.exports = router;
