// src/controllers/assignmentController.js
const db = require('../db/database');

// GET /api/assignments  — list (teacher sees all, student sees theirs)
exports.getAssignments = (req, res) => {
  const { week_id, student_id } = req.query;
  let query = `
    SELECT a.*, w.title AS week_title, w.number AS week_number,
           m.number AS month_number,
           s.name AS student_name, t.name AS teacher_name
    FROM assignments a
    JOIN weeks w ON w.id = a.week_id
    JOIN months m ON m.id = w.month_id
    JOIN users s ON s.id = a.student_id
    JOIN users t ON t.id = a.teacher_id
    WHERE 1=1
  `;
  const params = [];

  if (req.user.role === 'student') {
    query += ' AND a.student_id = ?';
    params.push(req.user.id);
  } else if (student_id) {
    query += ' AND a.student_id = ?';
    params.push(student_id);
  }

  if (week_id) { query += ' AND a.week_id = ?'; params.push(week_id); }
  query += ' ORDER BY a.created_at DESC';

  const rows = db.prepare(query).all(...params);

  // Attach submission status
  const enriched = rows.map(a => {
    const sub = db.prepare(
      'SELECT status, score, submitted_at FROM submissions WHERE assignment_id = ? AND student_id = ?'
    ).get(a.id, a.student_id);
    return { ...a, submission: sub || null };
  });

  return res.json({ success: true, data: enriched });
};

// POST /api/assignments  — teacher creates
exports.createAssignment = (req, res) => {
  const { week_id, student_id, title, description, due_date } = req.body;

  if (!week_id || !student_id || !title)
    return res.status(400).json({ success: false, message: 'week_id, student_id và title là bắt buộc.' });

  const result = db.prepare(`
    INSERT INTO assignments (week_id, teacher_id, student_id, title, description, due_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(week_id, req.user.id, student_id, title, description, due_date);

  return res.status(201).json({
    success: true,
    message: 'Tạo bài tập thành công.',
    data: { id: result.lastInsertRowid },
  });
};

// POST /api/assignments/:id/submit  — student submits
exports.submitAssignment = (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(id);
  if (!assignment)
    return res.status(404).json({ success: false, message: 'Bài tập không tồn tại.' });

  if (assignment.student_id !== req.user.id)
    return res.status(403).json({ success: false, message: 'Đây không phải bài tập của bạn.' });

  const existing = db.prepare(
    'SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?'
  ).get(id, req.user.id);

  if (existing) {
    db.prepare(`
      UPDATE submissions SET content = ?, status = 'submitted', submitted_at = datetime('now')
      WHERE assignment_id = ? AND student_id = ?
    `).run(content, id, req.user.id);
  } else {
    db.prepare(`
      INSERT INTO submissions (assignment_id, student_id, content, status, submitted_at)
      VALUES (?, ?, ?, 'submitted', datetime('now'))
    `).run(id, req.user.id, content);
  }

  return res.json({ success: true, message: 'Nộp bài thành công!' });
};

// PUT /api/assignments/:id/grade  — teacher grades
exports.gradeAssignment = (req, res) => {
  const { id } = req.params;
  const { score, feedback, student_id } = req.body;

  if (score == null || score < 0 || score > 10)
    return res.status(400).json({ success: false, message: 'Điểm phải từ 0 đến 10.' });

  const sub = db.prepare(
    'SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?'
  ).get(id, student_id);

  if (!sub)
    return res.status(404).json({ success: false, message: 'Chưa có bài nộp.' });

  db.prepare(`
    UPDATE submissions
    SET score = ?, feedback = ?, status = 'graded', graded_at = datetime('now')
    WHERE assignment_id = ? AND student_id = ?
  `).run(score, feedback, id, student_id);

  return res.json({ success: true, message: 'Chấm điểm thành công.' });
};

// GET /api/assignments/scores/:studentId  — grade report
exports.getScoreReport = (req, res) => {
  const { studentId } = req.params;

  if (req.user.role === 'student' && req.user.id !== Number(studentId))
    return res.status(403).json({ success: false, message: 'Không có quyền truy cập.' });

  const rows = db.prepare(`
    SELECT a.title, a.due_date,
           w.number AS week_number, w.title AS week_title,
           m.number AS month_number,
           s.score, s.feedback, s.status, s.submitted_at, s.graded_at
    FROM assignments a
    JOIN weeks w ON w.id = a.week_id
    JOIN months m ON m.id = w.month_id
    LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = a.student_id
    WHERE a.student_id = ?
    ORDER BY m.number, w.number, a.created_at
  `).all(studentId);

  const graded = rows.filter(r => r.status === 'graded');
  const avgScore = graded.length
    ? Math.round((graded.reduce((a, r) => a + r.score, 0) / graded.length) * 10) / 10
    : null;

  return res.json({
    success: true,
    data: {
      total: rows.length,
      submitted: rows.filter(r => r.status !== 'pending').length,
      graded: graded.length,
      averageScore: avgScore,
      assignments: rows,
    },
  });
};
