// src/controllers/studentController.js
const db = require('../db/database');

// GET /api/students  (teacher only)
exports.getAllStudents = (req, res) => {
  const students = db.prepare(`
    SELECT u.id, u.name, u.email, u.avatar, u.created_at,
           sp.level, sp.start_date, sp.target_country, sp.notes,
           t.name AS teacher_name
    FROM users u
    JOIN student_profiles sp ON sp.user_id = u.id
    LEFT JOIN users t ON t.id = sp.teacher_id
    WHERE u.role = 'student'
    ORDER BY u.created_at DESC
  `).all();

  return res.json({ success: true, data: students });
};

// GET /api/students/:id
exports.getStudent = (req, res) => {
  const { id } = req.params;

  // Students can only view themselves
  if (req.user.role === 'student' && req.user.id !== Number(id))
    return res.status(403).json({ success: false, message: 'Không có quyền truy cập.' });

  const student = db.prepare(`
    SELECT u.id, u.name, u.email, u.avatar, u.created_at,
           sp.level, sp.start_date, sp.target_country, sp.notes, sp.teacher_id
    FROM users u
    JOIN student_profiles sp ON sp.user_id = u.id
    WHERE u.id = ? AND u.role = 'student'
  `).get(id);

  if (!student)
    return res.status(404).json({ success: false, message: 'Không tìm thấy học viên.' });

  return res.json({ success: true, data: student });
};

// PUT /api/students/:id  (teacher or self)
exports.updateStudent = (req, res) => {
  const { id } = req.params;
  const { level, target_country, notes, teacher_id } = req.body;

  if (req.user.role === 'student' && req.user.id !== Number(id))
    return res.status(403).json({ success: false, message: 'Không có quyền chỉnh sửa.' });

  db.prepare(`
    UPDATE student_profiles
    SET level = COALESCE(?, level),
        target_country = COALESCE(?, target_country),
        notes = COALESCE(?, notes),
        teacher_id = COALESCE(?, teacher_id)
    WHERE user_id = ?
  `).run(level, target_country, notes, teacher_id, id);

  return res.json({ success: true, message: 'Cập nhật thành công.' });
};

// GET /api/students/:id/overview  — summary across all weeks
exports.getStudentOverview = (req, res) => {
  const { id } = req.params;

  if (req.user.role === 'student' && req.user.id !== Number(id))
    return res.status(403).json({ success: false, message: 'Không có quyền truy cập.' });

  const progressRows = db.prepare(`
    SELECT p.*, w.title AS week_title, w.number AS week_number, m.number AS month_number
    FROM progress p
    JOIN weeks w ON w.id = p.week_id
    JOIN months m ON m.id = w.month_id
    WHERE p.student_id = ?
    ORDER BY m.number, w.number
  `).all(id);

  const totalWeeks     = 12;
  const completedWeeks = progressRows.filter(r => r.completed).length;
  const avgScores = {
    speaking:  avg(progressRows, 'speaking_score'),
    listening: avg(progressRows, 'listening_score'),
    reading:   avg(progressRows, 'reading_score'),
    writing:   avg(progressRows, 'writing_score'),
  };

  return res.json({
    success: true,
    data: {
      totalWeeks,
      completedWeeks,
      completionRate: Math.round((completedWeeks / totalWeeks) * 100),
      avgScores,
      weeklyProgress: progressRows,
    },
  });
};

function avg(rows, field) {
  if (!rows.length) return 0;
  const vals = rows.map(r => r[field]).filter(v => v > 0);
  if (!vals.length) return 0;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}
