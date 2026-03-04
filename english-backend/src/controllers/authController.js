// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../db/database');

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// POST /api/auth/register
exports.register = (req, res) => {
  const { name, email, password, role = 'student' } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin.' });

  if (!['teacher', 'student'].includes(role))
    return res.status(400).json({ success: false, message: 'Role không hợp lệ.' });

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists)
    return res.status(409).json({ success: false, message: 'Email đã được đăng ký.' });

  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
  ).run(name, email, hashed, role);

  if (role === 'student') {
    db.prepare(
      'INSERT INTO student_profiles (user_id) VALUES (?)'
    ).run(result.lastInsertRowid);
  }

  const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?')
    .get(result.lastInsertRowid);

  return res.status(201).json({
    success: true,
    message: 'Đăng ký thành công!',
    token: signToken(user),
    user,
  });
};

// POST /api/auth/login
exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu.' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng.' });

  const { password: _, ...safeUser } = user;

  return res.json({
    success: true,
    message: 'Đăng nhập thành công!',
    token: signToken(safeUser),
    user: safeUser,
  });
};

// GET /api/auth/me
exports.me = (req, res) => {
  const user = db.prepare(
    'SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?'
  ).get(req.user.id);

  if (!user)
    return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });

  let profile = null;
  if (user.role === 'student') {
    profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(user.id);
  }

  return res.json({ success: true, user, profile });
};
