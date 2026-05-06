const express = require('express');
const router = express.Router();
const {
  getLogs,
  addLog,
  getMetrics,
  getAlerts,
  handleStream,
} = require('../controllers/logController');

router.get('/', getLogs);
router.get('/stream', handleStream);
router.post('/', addLog);
router.get('/metrics', getMetrics);
router.get('/alerts', getAlerts);

module.exports = router;
