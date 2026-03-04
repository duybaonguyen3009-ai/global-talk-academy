// src/middleware/auth.js
const jwt = require('jsonwebtoken');

const auth = (roles = []) => (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Không có token xác thực.' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;

    if (roles.length && !roles.includes(payload.role)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập.' });
    }
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
};

module.exports = auth;
