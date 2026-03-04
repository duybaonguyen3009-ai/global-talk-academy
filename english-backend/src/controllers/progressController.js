// src/controllers/progressController.js
const db = require('../db/database');

// GET /api/progress/:studentId  — all weeks progress
exports.getProgress = (req, res) => {
  const { studentId } = req.params;

  if (req.user.role === 'student' && req.user.id !== Number(studentId))
    return res.status(403).json({ success: false, message: 'Không có quyền truy cập.' });

  const rows = db.prepare(`
    SELECT
      m.id AS month_id, m.number AS month_number, m.title AS month_title, m.theme,
      w.id AS week_id,  w.number AS week_number,  w.title AS week_title,
      w.topics,
      COALESCE(p.completed,        0)   AS completed,
      COALESCE(p.speaking_score,   0)   AS speaking_score,
      COALESCE(p.listening_score,  0)   AS listening_score,
      COALESCE(p.reading_score,    0)   AS reading_score,
      COALESCE(p.writing_score,    0)   AS writing_score,
      p.notes,
      p.updated_at
    FROM months m
    JOIN weeks  w ON w.month_id = m.id
    LEFT JOIN progress p ON p.week_id = w.id AND p.student_id = ?
    ORDER BY m.number, w.number
  `).all(studentId);

  // Group by month
  const months = {};
  for (const r of rows) {
    if (!months[r.month_id]) {
      months[r.month_id] = {
        id: r.month_id, number: r.month_number,
        title: r.month_title, theme: r.theme,
        weeks: [],
      };
    }
    months[r.month_id].weeks.push({
      id: r.week_id, number: r.week_number, title: r.week_title,
      topics: JSON.parse(r.topics || '[]'),
      completed: Boolean(r.completed),
      scores: {
        speaking:  r.speaking_score,
        listening: r.listening_score,
        reading:   r.reading_score,
        writing:   r.writing_score,
      },
      notes: r.notes,
      updated_at: r.updated_at,
    });
  }

  return res.json({ success: true, data: Object.values(months) });
};

// PUT /api/progress/:studentId/week/:weekId  — upsert progress for one week
exports.updateWeekProgress = (req, res) => {
  const { studentId, weekId } = req.params;
  const { completed, speaking_score, listening_score, reading_score, writing_score, notes } = req.body;

  // Only teacher or the student themselves
  if (req.user.role === 'student' && req.user.id !== Number(studentId))
    return res.status(403).json({ success: false, message: 'Không có quyền cập nhật.' });

  const week = db.prepare('SELECT id FROM weeks WHERE id = ?').get(weekId);
  if (!week)
    return res.status(404).json({ success: false, message: 'Tuần học không tồn tại.' });

  db.prepare(`
    INSERT INTO progress (student_id, week_id, completed, speaking_score, listening_score, reading_score, writing_score, notes, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(student_id, week_id) DO UPDATE SET
      completed        = COALESCE(excluded.completed,        completed),
      speaking_score   = COALESCE(excluded.speaking_score,   speaking_score),
      listening_score  = COALESCE(excluded.listening_score,  listening_score),
      reading_score    = COALESCE(excluded.reading_score,    reading_score),
      writing_score    = COALESCE(excluded.writing_score,    writing_score),
      notes            = COALESCE(excluded.notes,            notes),
      updated_at       = datetime('now')
  `).run(
    studentId, weekId,
    completed != null ? Number(completed) : null,
    speaking_score  ?? null,
    listening_score ?? null,
    reading_score   ?? null,
    writing_score   ?? null,
    notes ?? null,
  );

  return res.json({ success: true, message: 'Cập nhật tiến độ thành công.' });
};

// GET /api/progress/:studentId/month/:monthNumber  — month summary
exports.getMonthSummary = (req, res) => {
  const { studentId, monthNumber } = req.params;

  if (req.user.role === 'student' && req.user.id !== Number(studentId))
    return res.status(403).json({ success: false, message: 'Không có quyền truy cập.' });

  const month = db.prepare('SELECT * FROM months WHERE number = ?').get(monthNumber);
  if (!month)
    return res.status(404).json({ success: false, message: 'Tháng không tồn tại.' });

  const rows = db.prepare(`
    SELECT w.number, w.title,
           COALESCE(p.completed,0) AS completed,
           COALESCE(p.speaking_score,0) AS sp,
           COALESCE(p.listening_score,0) AS li,
           COALESCE(p.reading_score,0) AS re,
           COALESCE(p.writing_score,0) AS wr
    FROM weeks w
    LEFT JOIN progress p ON p.week_id = w.id AND p.student_id = ?
    WHERE w.month_id = ?
    ORDER BY w.number
  `).all(studentId, month.id);

  const completed = rows.filter(r => r.completed).length;
  const allScores = rows.flatMap(r => [r.sp, r.li, r.re, r.wr]).filter(v => v > 0);
  const overall   = allScores.length
    ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10
    : 0;

  return res.json({
    success: true,
    data: {
      month,
      completedWeeks: completed,
      totalWeeks: rows.length,
      overallScore: overall,
      weeks: rows,
    },
  });
};
