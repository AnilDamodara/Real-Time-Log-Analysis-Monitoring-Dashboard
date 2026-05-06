const url = process.env.SPLUNK_HEC_URL;
const token = process.env.SPLUNK_HEC_TOKEN;
const index = process.env.SPLUNK_INDEX || 'main';

if (!url || !token) {
  console.warn('SPLUNK_HEC_URL or SPLUNK_HEC_TOKEN is not defined. Splunk events will fail until both are set.');
}

async function sendToSplunk(event) {
  if (!url || !token) {
    throw new Error('Missing Splunk HEC configuration. Set SPLUNK_HEC_URL and SPLUNK_HEC_TOKEN.');
  }

  const body = {
    ...event,
    index,
  };

  const response = await fetch(`${url.replace(/\/$/, '')}/services/collector/event`, {
    method: 'POST',
    headers: {
      'Authorization': `Splunk ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Splunk HEC returned ${response.status}: ${text}`);
  }

  return response.json();
}

module.exports = { sendToSplunk };
