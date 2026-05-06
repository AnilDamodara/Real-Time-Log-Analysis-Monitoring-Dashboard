const { sendToSplunk } = require('../services/splunkService');

async function sendEvent(req, res) {
  try {
    const event = {
      timestamp: Math.floor(Date.now() / 1000),
      host: req.body.host || 'local-host',
      source: process.env.SPLUNK_SOURCE || 'log-analysis-app',
      sourcetype: process.env.SPLUNK_SOURCETYPE || '_json',
      event: req.body,
    };

    const result = await sendToSplunk(event);
    res.json({ ok: true, result });
  } catch (error) {
    console.error('Splunk send error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

async function testConnection(req, res) {
  try {
    const sampleEvent = {
      timestamp: Math.floor(Date.now() / 1000),
      host: 'local-host',
      source: process.env.SPLUNK_SOURCE || 'log-analysis-app',
      sourcetype: process.env.SPLUNK_SOURCETYPE || '_json',
      event: {
        level: 'INFO',
        message: 'Splunk connectivity test event',
        source: 'backend',
      },
    };

    const result = await sendToSplunk(sampleEvent);
    res.json({ ok: true, result });
  } catch (error) {
    console.error('Splunk test error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

module.exports = { sendEvent, testConnection };
