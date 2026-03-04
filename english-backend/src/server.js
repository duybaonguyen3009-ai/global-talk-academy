// src/server.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const routes  = require('./routes');
const path = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// ── MIDDLEWARE ────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── REQUEST LOGGER (dev) ──────────────────────────────
app.use((req, _res, next) => {
  const time = new Date().toISOString().slice(11, 19);
  console.log(`[${time}] ${req.method} ${req.path}`);
  next();
});

// ── ROUTES ────────────────────────────────────────────
app.use('/api', routes);

// ── HEALTH CHECK ──────────────────────────────────────
app.get('/api', (_req, res) => {
  res.json({
    success: true,
    message: '🎓 English Curriculum API đang chạy!',
    version: '1.0.0',
    endpoints: {
      auth:        ['POST /api/auth/register', 'POST /api/auth/login', 'GET /api/auth/me'],
      curriculum:  ['GET /api/curriculum', 'GET /api/curriculum/weeks/:id'],
      students:    ['GET /api/students', 'GET /api/students/:id', 'PUT /api/students/:id', 'GET /api/students/:id/overview'],
      progress:    ['GET /api/progress/:studentId', 'PUT /api/progress/:studentId/week/:weekId', 'GET /api/progress/:studentId/month/:monthNumber'],
      assignments: ['GET /api/assignments', 'POST /api/assignments', 'POST /api/assignments/:id/submit', 'PUT /api/assignments/:id/grade', 'GET /api/assignments/scores/:studentId'],
    },
  });
});

// ── 404 ───────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: 'Endpoint không tồn tại.' }));

// ── ERROR HANDLER ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
});

app.listen(PORT, () => {
  console.log('');
  console.log('  🎓  English Curriculum Backend');
  console.log(`  🚀  Server: http://localhost:${PORT}`);
  console.log(`  📋  API:    http://localhost:${PORT}/api`);
  console.log('');
});
