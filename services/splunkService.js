const url = process.env.SPLUNK_HEC_URL;
const token = process.env.SPLUNK_HEC_TOKEN;
const index = process.env.SPLUNK_INDEX || 'main';

// Remove the warning on module load - only warn when actually trying to send

async function sendToSplunk(event) {
  if (!url || !token) {
    throw new Error('Splunk HEC not configured. Set SPLUNK_HEC_URL and SPLUNK_HEC_TOKEN environment variables.');
  }

  const body = {
    event: event,
    index,
  };

  const response = await fetch(`${url}/services/collector/event`, {
    method: 'POST',
    headers: {
      Authorization: `Splunk ${token}`,
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
