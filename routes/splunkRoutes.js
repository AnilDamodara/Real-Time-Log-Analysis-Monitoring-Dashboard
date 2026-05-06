const express = require('express');
const router = express.Router();
const { sendEvent, testConnection } = require('../controllers/splunkController');

router.post('/send', sendEvent);
router.get('/test', testConnection);

module.exports = router;
