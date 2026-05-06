# Log Analysis and Monitoring

A full-stack sample project for log analysis and monitoring using Splunk integration, with a React frontend and Node.js backend.

## Features

- REST API backend serving log data and forwarding events to Splunk via HTTP Event Collector (HEC)
- React dashboard for viewing and filtering logs
- Sample log ingestion endpoint and Splunk test event flow
- Easy local development with Vite and Express

## Project structure

- `backend/` — Express server, Splunk HEC client, sample logs data
  - `backend/routes/` — request routing layer
    - `backend/routes/logRoutes.js`
    - `backend/routes/splunkRoutes.js`
  - `backend/controllers/` — request handlers and SSE streaming
    - `backend/controllers/logController.js`
    - `backend/controllers/splunkController.js`
  - `backend/services/` — business logic and log analytics
    - `backend/services/logService.js`
    - `backend/services/splunkService.js`
- `frontend/` — React app built with Vite

## Prerequisites

- Node.js 18+ installed
- A Splunk instance with HTTP Event Collector enabled
- Splunk HEC token and URL

## Setup

1. Open two terminals.
2. In the backend folder:

```powershell
cd "c:\Users\Anil\Desktop\Log Analysis\backend"
npm install
```

3. In the frontend folder:

```powershell
cd "c:\Users\Anil\Desktop\Log Analysis\frontend"
npm install
```

4. Configure environment variables for Splunk in `backend/.env`:

```text
BACKEND_PORT=4000
SPLUNK_HEC_URL=https://your-splunk-host:8088
SPLUNK_HEC_TOKEN=your_hec_token
SPLUNK_INDEX=main
SPLUNK_SOURCE=log-analysis-app
SPLUNK_SOURCETYPE=_json
```

5. Start the backend:

```powershell
npm start
```

6. Start the frontend:

```powershell
npm run dev
```

## Usage

- Visit the frontend URL shown by Vite.
- The dashboard loads sample logs from the backend.
- Use the search box and filter controls to reduce log noise.
- Monitor KPI cards for error rate and suspicious IP detections.
- Active alerts and real-time updates appear automatically.
- Send a sample suspicious log to Splunk using the dashboard button.

## New features

- Suspicious IP detection with repeated WARN/ERROR events
- Geo-location for IP addresses built into log entries
- Log filtering UI by level, source, and IP address
- KPI cards for total logs, error rate, suspicious IPs, and real-time status
- Alerts panel for anomaly detection and suspicious IP activity
- Real-time dashboard updates via server-sent events (SSE)
- Anomaly detection for sudden error-rate spikes

## Splunk integration

This project sends events to Splunk via the HEC endpoint defined by `SPLUNK_HEC_URL` and `SPLUNK_HEC_TOKEN`.

### Sample Splunk dashboard queries

- Event volume by log level over time:

```splunk
index=main source="log-analysis-app"
| timechart span=1m count by level
```

- Error events in the last 24 hours:

```splunk
index=main source="log-analysis-app" level=ERROR
| stats count by source, service
| sort -count
```

- Top services generating warnings and errors:

```splunk
index=main source="log-analysis-app" level=ERROR OR level=WARN
| stats count by service, level
| sort -count
```

- Recent logs containing a keyword:

```splunk
index=main source="log-analysis-app"
| search message="*login*" OR message="*database*"
| table _time level source service message
| sort -_time
```

- Summary by source and service:

```splunk
index=main source="log-analysis-app"
| stats count as event_count by source, service, level
| sort -event_count
```

## Notes

- This sample project is designed for local development and demonstration.
- Replace sample data and Splunk metadata with your own application logs.
