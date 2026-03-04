// src/controllers/curriculumController.js
const db = require('../db/database');

// GET /api/curriculum  — full curriculum
exports.getCurriculum = (req, res) => {
  const months = db.prepare('SELECT * FROM months ORDER BY number').all();
  const weeks  = db.prepare('SELECT * FROM weeks  ORDER BY number').all();

  const data = months.map(m => ({
    ...m,
    weeks: weeks
      .filter(w => w.month_id === m.id)
      .map(w => ({ ...w, topics: JSON.parse(w.topics || '[]') })),
  }));

  return res.json({ success: true, data });
};

// GET /api/curriculum/weeks/:id
exports.getWeek = (req, res) => {
  const week = db.prepare('SELECT * FROM weeks WHERE id = ?').get(req.params.id);
  if (!week)
    return res.status(404).json({ success: false, message: 'Không tìm thấy tuần học.' });

  return res.json({
    success: true,
    data: { ...week, topics: JSON.parse(week.topics || '[]') },
  });
};
