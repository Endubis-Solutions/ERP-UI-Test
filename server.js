'use strict';

const path = require('path');
const express = require('express');
const {
  LOCATIONS,
  getDashboard,
  markExpected,
  resetTraining,
  getTrainingLog,
  forceSync,
  getLocation,
  getLedger,
} = require('./server/data');
const { answer } = require('./server/assistant');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use(
  express.static(PUBLIC_DIR, {
    extensions: ['html'],
    etag: true,
    maxAge: 0,
  }),
);

function resolveLocation(value) {
  return LOCATIONS.some((location) => location.id === value) ? value : 'global';
}

app.get('/api/locations', (req, res) => {
  res.json({ locations: LOCATIONS });
});

app.get('/api/dashboard', (req, res) => {
  res.json(getDashboard(resolveLocation(String(req.query.location || 'global'))));
});

app.get('/api/ledger', (req, res) => {
  res.json(getLedger(resolveLocation(String(req.query.location || 'global'))));
});

app.post('/api/alerts/:id/expect', (req, res) => {
  const location = resolveLocation(String(req.body?.location || 'global'));
  const reason = String(req.body?.reason || 'Expected pattern');
  const result = markExpected(location, req.params.id, reason);
  if (!result) {
    return res.status(404).json({ error: 'Alert not found for this location' });
  }
  return res.json(result);
});

app.get('/api/training', (req, res) => {
  res.json({ log: getTrainingLog() });
});

app.post('/api/training/reset', (req, res) => {
  res.json(resetTraining());
});

app.post('/api/sync', (req, res) => {
  res.json(forceSync());
});

app.post('/api/assistant/query', (req, res) => {
  const message = String(req.body?.message || '').slice(0, 500);
  if (!message.trim()) {
    return res.status(400).json({ error: 'A message is required' });
  }
  const location = getLocation(resolveLocation(String(req.body?.location || 'global')));
  return res.json({ reply: answer(message, location.id), location: location.id });
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Unknown API route' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('[erp]', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Unexpected server error' });
});

app.listen(PORT, () => {
  console.log(`Mad Vervet executive console → http://localhost:${PORT}`);
});
