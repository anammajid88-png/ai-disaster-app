'use strict';

const express = require('express');

const router = express.Router();

router.use('/health', require('./health'));
router.use('/chat', require('./chat'));
router.use('/content', require('./content'));

module.exports = router;
