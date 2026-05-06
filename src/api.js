export async function fetchLogs(query = '') {
  const response = await fetch(`/api/logs${query}`);

  if (!response.ok) {
    throw new Error(`Server responded with ${response.status}`);
  }

  return response.json();
}

export async function fetchMetrics() {
  const response = await fetch('/api/logs/metrics');

  if (!response.ok) {
    throw new Error(`Server responded with ${response.status}`);
  }

  return response.json();
}

export async function fetchAlerts() {
  const response = await fetch('/api/logs/alerts');

  if (!response.ok) {
    throw new Error(`Server responded with ${response.status}`);
  }

  return response.json();
}

export async function createLog(payload) {
  const response = await fetch('/api/logs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Server responded with ${response.status}`);
  }

  return response.json();
}

export async function sendSplunkEvent(payload) {
  const response = await fetch('/api/splunk/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Server responded with ${response.status}`);
  }

  return response.json();
}
