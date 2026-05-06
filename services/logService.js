const fs = require('fs');
const path = require('path');

const SAMPLE_LOGS_PATH = path.join(__dirname, '..', 'data', 'sample-logs.json');
const geoLookup = {
  '203.0.113.11': { country: 'United States', city: 'New York' },
  '198.51.100.22': { country: 'Canada', city: 'Toronto' },
  '192.0.2.5': { country: 'Germany', city: 'Berlin' },
  '198.51.100.55': { country: 'India', city: 'Bengaluru' },
  '203.0.113.140': { country: 'Australia', city: 'Sydney' },
};

function loadLogs() {
  try {
    return JSON.parse(fs.readFileSync(SAMPLE_LOGS_PATH, 'utf8')) || [];
  } catch (error) {
    return [];
  }
}

function saveLogs(logs) {
  fs.writeFileSync(SAMPLE_LOGS_PATH, JSON.stringify(logs, null, 2), 'utf8');
}

function getGeoLocation(ip) {
  return geoLookup[ip] || { country: 'Unknown', city: 'Unknown' };
}

function normalizeLogEntry(body) {
  const ip = body.ip || '203.0.113.11';
  const geo = getGeoLocation(ip);

  return {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    level: (body.level || 'INFO').toUpperCase(),
    message: body.message || 'New log event.',
    source: body.source || 'backend',
    service: body.service || 'auth-service',
    ip,
    country: geo.country,
    city: geo.city,
    metadata: body.metadata || {},
    eventType: body.eventType || 'application',
  };
}

function filterLogs(logs, query) {
  const search = (query.search || '').toLowerCase();
  const level = (query.level || 'ALL').toUpperCase();
  const source = (query.source || 'ALL').toLowerCase();
  const ip = (query.ip || '').toLowerCase();

  return logs.filter((log) => {
    if (level !== 'ALL' && log.level !== level) {
      return false;
    }
    if (source !== 'ALL' && log.source.toLowerCase() !== source) {
      return false;
    }
    if (ip && log.ip.toLowerCase() !== ip) {
      return false;
    }

    if (!search) {
      return true;
    }

    const text = `${log.level} ${log.message} ${log.source} ${log.service} ${log.ip} ${log.city} ${log.country}`.toLowerCase();
    return text.includes(search);
  });
}

function detectSuspiciousIps(logs) {
  const recent = logs.slice(0, 80);

  const ipCounts = recent.reduce((agg, log) => {
    if (['ERROR', 'WARN'].includes(log.level)) {
      agg[log.ip] = (agg[log.ip] || 0) + 1;
    }
    return agg;
  }, {});

  return Object.entries(ipCounts)
    .filter(([, count]) => count >= 2)
    .map(([ip, count]) => ({ ip, count, ...getGeoLocation(ip) }));
}

function detectAnomalies(logs) {
  const recentLogs = logs.slice(0, 30);
  const errorRate = recentLogs.filter((log) => log.level === 'ERROR').length / Math.max(recentLogs.length, 1);
  const previousLogs = logs.slice(30, 90);
  const previousErrorRate = previousLogs.filter((log) => log.level === 'ERROR').length / Math.max(previousLogs.length, 1);

  if (errorRate >= 0.4 && errorRate - previousErrorRate >= 0.15) {
    return [
      {
        type: 'Anomaly Detection',
        severity: 'high',
        message: `Error rate spiked to ${(errorRate * 100).toFixed(0)}% in the latest logs.`,
      },
    ];
  }

  return [];
}

function computeMetrics(logs) {
  const total = logs.length;
  const counts = logs.reduce(
    (agg, log) => {
      agg[log.level] = (agg[log.level] || 0) + 1;
      return agg;
    },
    { INFO: 0, WARN: 0, ERROR: 0 }
  );

  const errorCount = counts.ERROR || 0;
  const warnCount = counts.WARN || 0;
  const errorRate = total === 0 ? 0 : Math.round((errorCount / total) * 100);

  return {
    totalLogs: total,
    infoCount: counts.INFO,
    warnCount,
    errorCount,
    errorRate,
    suspiciousIpCount: detectSuspiciousIps(logs).length,
    lastUpdated: new Date().toISOString(),
  };
}

function buildAlerts(logs) {
  const suspicious = detectSuspiciousIps(logs);
  const anomalies = detectAnomalies(logs);

  const alerts = [];

  if (suspicious.length > 0) {
    alerts.push(
      ...suspicious.map((item) => ({
        type: 'Suspicious IP',
        severity: 'medium',
        message: `${item.ip} generated ${item.count} warning/error logs from ${item.city}, ${item.country}`,
      }))
    );
  }

  if (anomalies.length > 0) {
    alerts.push(...anomalies);
  }

  return alerts;
}

function addLog(body) {
  const logs = loadLogs();
  const newLog = normalizeLogEntry(body);

  logs.unshift(newLog);
  const updatedLogs = logs.slice(0, 200);
  saveLogs(updatedLogs);

  return {
    newLog,
    metrics: computeMetrics(updatedLogs),
    alerts: buildAlerts(updatedLogs),
    logs: updatedLogs,
  };
}

module.exports = {
  loadLogs,
  saveLogs,
  filterLogs,
  computeMetrics,
  buildAlerts,
  addLog,
};
