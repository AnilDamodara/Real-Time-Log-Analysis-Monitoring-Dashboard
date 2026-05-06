import { useEffect, useMemo, useState } from 'react';
import { createLog, fetchAlerts, fetchLogs, fetchMetrics, sendSplunkEvent } from '../api.js';
import './LogDashboard.css';

const LOG_LEVELS = ['ALL', 'INFO', 'WARN', 'ERROR'];

function LogDashboard() {
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState({ totalLogs: 0, errorRate: 0, suspiciousIpCount: 0 });
  const [alerts, setAlerts] = useState([]);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [ipFilter, setIpFilter] = useState('');
  const [status, setStatus] = useState('Loading dashboard...');
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [logResponse, metricResponse, alertResponse] = await Promise.all([
          fetchLogs(),
          fetchMetrics(),
          fetchAlerts(),
        ]);

        setLogs(logResponse.logs || []);
        setMetrics(metricResponse.metrics || {});
        setAlerts(alertResponse.alerts || []);
        setStatus('Dashboard ready.');
      } catch (error) {
        setStatus(`Unable to load dashboard: ${error.message}`);
      }
    }

    loadDashboard();

    const eventSource = new EventSource('/api/logs/stream');

    eventSource.addEventListener('open', () => {
      setConnected(true);
      setStatus('Connected to real-time stream.');
    });

    eventSource.addEventListener('initial-state', (event) => {
      const payload = JSON.parse(event.data);
      setLogs(payload.logs || []);
      setMetrics(payload.metrics || {});
      setAlerts(payload.alerts || []);
      setLastUpdate(new Date().toLocaleTimeString());
    });

    eventSource.addEventListener('log-update', (event) => {
      const payload = JSON.parse(event.data);
      setLogs((current) => [payload.log, ...current].slice(0, 200));
      setMetrics(payload.metrics || metrics);
      setAlerts(payload.alerts || alerts);
      setLastUpdate(new Date().toLocaleTimeString());
    });

    eventSource.addEventListener('metrics-update', (event) => {
      const payload = JSON.parse(event.data);
      setMetrics(payload.metrics || metrics);
      setLastUpdate(new Date().toLocaleTimeString());
    });

    eventSource.addEventListener('alerts-update', (event) => {
      const payload = JSON.parse(event.data);
      setAlerts(payload.alerts || []);
      setLastUpdate(new Date().toLocaleTimeString());
    });

    eventSource.addEventListener('error', () => {
      setConnected(false);
      setStatus('Real-time stream disconnected. Reconnect will be attempted automatically.');
    });

    return () => {
      eventSource.close();
    };
  }, []);

  const handleSendSampleLog = async () => {
    setSending(true);
    setStatus('Sending sample security log and forwarding to Splunk...');

    const payload = {
      level: 'WARN',
      message: 'Suspicious login pattern detected from an external IP.',
      source: 'frontend',
      service: 'security-monitor',
      ip: '198.51.100.22',
      metadata: { action: 'failed-login', user: 'unknown' },
      eventType: 'security',
    };

    try {
      await createLog(payload);
      await sendSplunkEvent(payload);
      setStatus('Sample log created and sent to Splunk.');
    } catch (error) {
      setStatus(`Action failed: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = [
        log.level,
        log.message,
        log.source,
        log.service,
        log.ip,
        log.city,
        log.country,
      ]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesLevel = levelFilter === 'ALL' || log.level === levelFilter;
      const matchesSource = sourceFilter === 'ALL' || log.source === sourceFilter;
      const matchesIp = !ipFilter || log.ip === ipFilter;

      return matchesSearch && matchesLevel && matchesSource && matchesIp;
    });
  }, [logs, search, levelFilter, sourceFilter, ipFilter]);

  const sources = useMemo(() => ['ALL', ...new Set(logs.map((log) => log.source))], [logs]);

  return (
    <section className="dashboard-card">
      <div className="dashboard-summary">
        <div className="metric-card">
          <span className="metric-label">Total Logs</span>
          <strong>{metrics.totalLogs ?? 0}</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">Error Rate</span>
          <strong>{metrics.errorRate ?? 0}%</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">Suspicious IPs</span>
          <strong>{metrics.suspiciousIpCount ?? 0}</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">Real-Time</span>
          <strong>{connected ? 'Connected' : 'Disconnected'}</strong>
        </div>
      </div>

      <div className="dashboard-actions">
        <div className="filter-grid">
          <div>
            <label htmlFor="search">Search logs</label>
            <input
              id="search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by message, service, IP..."
            />
          </div>
          <div>
            <label htmlFor="level">Level</label>
            <select id="level" value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}>
              {LOG_LEVELS.map((levelOption) => (
                <option key={levelOption} value={levelOption}>
                  {levelOption}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="source">Source</label>
            <select id="source" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ip">IP address</label>
            <input
              id="ip"
              type="text"
              value={ipFilter}
              onChange={(event) => setIpFilter(event.target.value)}
              placeholder="Filter by IP"
            />
          </div>
        </div>

        <button type="button" onClick={handleSendSampleLog} disabled={sending}>
          {sending ? 'Sending...' : 'Send suspicious log to Splunk'}
        </button>
      </div>

      <div className="dashboard-status">
        <span>{status}</span>
        <span>{lastUpdate ? `Last update: ${lastUpdate}` : ''}</span>
      </div>

      <div className="alert-panel">
        <h2>Active Alerts</h2>
        {alerts.length === 0 ? (
          <p>No active alerts detected.</p>
        ) : (
          <div className="alert-list">
            {alerts.map((alert, index) => (
              <div key={`${alert.type}-${index}`} className={`alert-card alert-${alert.severity}`}>
                <strong>{alert.type}</strong>
                <p>{alert.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Level</th>
              <th>Message</th>
              <th>Source</th>
              <th>Service</th>
              <th>IP</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-row">
                  No logs match the current filters.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>{log.level}</td>
                  <td>{log.message}</td>
                  <td>{log.source}</td>
                  <td>{log.service || 'N/A'}</td>
                  <td>{log.ip || 'N/A'}</td>
                  <td>{log.city ? `${log.city}, ${log.country}` : 'Unknown'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default LogDashboard;
