const { loadLogs, filterLogs, computeMetrics, buildAlerts, addLog: createLog } = require('../services/logService');

const streamClients = new Set();

function sendSseEvent(res, event, payload) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function broadcastSse(event, payload) {
  streamClients.forEach((res) => {
    try {
      sendSseEvent(res, event, payload);
    } catch (error) {
      streamClients.delete(res);
    }
  });
}

function getLogs(req, res) {
  const logs = filterLogs(loadLogs(), req.query);
  res.json({ logs });
}

function addLog(req, res) {
  try {
    const { newLog, metrics, alerts } = createLog(req.body);

    broadcastSse('log-update', { log: newLog, metrics, alerts });
    broadcastSse('metrics-update', { metrics });
    broadcastSse('alerts-update', { alerts });

    res.status(201).json({ log: newLog });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

function getMetrics(req, res) {
  res.json({ metrics: computeMetrics(loadLogs()) });
}

function getAlerts(req, res) {
  res.json({ alerts: buildAlerts(loadLogs()) });
}

function handleStream(req, res) {
  res.writeHead(200, {
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream',
  });

  res.write(': connected\n\n');
  streamClients.add(res);

  const logs = loadLogs();
  sendSseEvent(res, 'initial-state', {
    logs: logs.slice(0, 100),
    metrics: computeMetrics(logs),
    alerts: buildAlerts(logs),
  });

  req.on('close', () => {
    streamClients.delete(res);
  });
}

module.exports = {
  getLogs,
  addLog,
  getMetrics,
  getAlerts,
  handleStream,
};
