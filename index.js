require('dotenv').config();


const express = require('express');
const cors = require('cors');
const logRoutes = require('./routes/logRoutes');
const splunkRoutes = require('./routes/splunkRoutes');


const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.BACKEND_PORT || 4000;

app.use('/api/logs', logRoutes);
app.use('/api/splunk', splunkRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
