// src/db/seed.js  –  Run once: node src/db/seed.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./database');

console.log('🌱 Seeding database...');

// ─── CURRICULUM DATA ────────────────────────────────────────────
const curriculum = [
  {
    number: 1,
    title: 'Tháng 1 – Nền Tảng Giao Tiếp',
    theme: 'FOUNDATION',
    description: 'Xây dựng vốn từ cơ bản & kỹ năng phát âm chuẩn',
    weeks: [
      { number: 1, title: 'Chào hỏi & Giới thiệu bản thân', topics: ['Greetings cơ bản', 'Giới thiệu tên/quốc tịch/nghề nghiệp', 'Phát âm bảng chữ cái', 'Luyện tập hội thoại ngắn'] },
      { number: 2, title: 'Tại Sân Bay & Nhập Cảnh',        topics: ['Check-in & boarding pass', 'Trả lời câu hỏi hải quan', 'Hỏi thông tin chuyến bay', 'Từ vựng sân bay cần thiết'] },
      { number: 3, title: 'Di Chuyển & Giao Thông',         topics: ['Taxi, Uber, xe buýt, tàu điện ngầm', 'Hỏi đường & mô tả vị trí', 'Mua vé & kiểm tra lịch trình', 'Xử lý khi bị lạc'] },
      { number: 4, title: 'Đặt Phòng & Lưu Trú',            topics: ['Check-in/out khách sạn', 'Yêu cầu & phàn nàn với lễ tân', 'Đặt phòng qua điện thoại/email', 'Tiện ích & dịch vụ phòng'] },
    ],
  },
  {
    number: 2,
    title: 'Tháng 2 – Giao Tiếp Mở Rộng',
    theme: 'EXPANSION',
    description: 'Ứng dụng tiếng Anh trong cuộc sống & học tập hàng ngày',
    weeks: [
      { number: 5,  title: 'Ăn Uống & Nhà Hàng',                 topics: ['Gọi món & menu', 'Hỏi về thành phần & dị ứng', 'Thanh toán & tip', 'Fast food vs. fine dining'] },
      { number: 6,  title: 'Mua Sắm & Giao Dịch',                topics: ['Hỏi giá & mặc cả', 'Đổi/trả hàng & khiếu nại', 'Thanh toán tiền mặt & thẻ', 'Từ vựng siêu thị & mall'] },
      { number: 7,  title: 'Trường Học & Môi Trường Học Tập',    topics: ['Giao tiếp với giáo viên & bạn cùng lớp', 'Xin phép & hỏi bài', 'Email học thuật cơ bản', 'Từ vựng trường học & thư viện'] },
      { number: 8,  title: 'Y Tế & Sức Khỏe',                    topics: ['Mô tả triệu chứng & đặt lịch bác sĩ', 'Mua thuốc tại nhà thuốc', 'Bảo hiểm y tế cơ bản', 'Gọi cấp cứu & khẩn cấp'] },
    ],
  },
  {
    number: 3,
    title: 'Tháng 3 – Tự Tin & Lưu Loát',
    theme: 'FLUENCY',
    description: 'Nâng cao khả năng diễn đạt & xử lý tình huống phức tạp',
    weeks: [
      { number: 9,  title: 'Xã Giao & Kết Bạn',                  topics: ['Small talk & chủ đề an toàn', 'Bày tỏ ý kiến & đồng ý/không đồng ý', 'Kết nối bạn bè quốc tế', 'Văn hóa giao tiếp các nước'] },
      { number: 10, title: 'Nhà Ở & Cuộc Sống Hàng Ngày',        topics: ['Thuê nhà & ký hợp đồng', 'Tiện ích & hàng xóm', 'Ngân hàng & SIM card', 'Lịch sử dụng & thói quen'] },
      { number: 11, title: 'Xử Lý Sự Cố & Khẩn Cấp',            topics: ['Mất hộ chiếu & ví', 'Báo cảnh sát & đại sứ quán', 'Tai nạn & gọi hỗ trợ khẩn cấp', 'Giao tiếp khi căng thẳng'] },
      { number: 12, title: 'Ôn Tập & Thực Hành Tổng Hợp',        topics: ['Role-play các tình huống thực tế', 'Thảo luận chủ đề tự do', 'Kiểm tra đầu ra & phản hồi', 'Kế hoạch học tiếp sau khóa'] },
    ],
  },
];

// Insert curriculum
const insertMonth = db.prepare(`INSERT OR IGNORE INTO months (number, title, theme, description) VALUES (?,?,?,?)`);
const insertWeek  = db.prepare(`INSERT OR IGNORE INTO weeks  (month_id, number, title, topics)  VALUES (?,?,?,?)`);

for (const m of curriculum) {
  const res = insertMonth.run(m.number, m.title, m.theme, m.description);
  const monthId = res.lastInsertRowid || db.prepare('SELECT id FROM months WHERE number=?').get(m.number).id;
  for (const w of m.weeks) {
    insertWeek.run(monthId, w.number, w.title, JSON.stringify(w.topics));
  }
}

// ─── DEMO USERS ─────────────────────────────────────────────────
const hash = (p) => bcrypt.hashSync(p, 10);

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?,?,?,?)
`);
const insertProfile = db.prepare(`
  INSERT OR IGNORE INTO student_profiles (user_id, teacher_id, level, start_date, target_country)
  VALUES (?,?,?,?,?)
`);

// Teacher
insertUser.run('Nguyễn Giáo Viên', 'teacher@example.com', hash('teacher123'), 'teacher');
const teacher = db.prepare('SELECT id FROM users WHERE email=?').get('teacher@example.com');

// Students
const students = [
  { name: 'Trần Học Viên A', email: 'student_a@example.com', level: 'beginner',     country: 'Úc' },
  { name: 'Lê Học Viên B',   email: 'student_b@example.com', level: 'elementary',   country: 'Mỹ' },
  { name: 'Phạm Học Viên C', email: 'student_c@example.com', level: 'intermediate', country: 'Anh' },
];

for (const s of students) {
  insertUser.run(s.name, s.email, hash('student123'), 'student');
  const user = db.prepare('SELECT id FROM users WHERE email=?').get(s.email);
  insertProfile.run(user.id, teacher.id, s.level, new Date().toISOString().split('T')[0], s.country);
}

console.log('✅ Seed hoàn tất!');
console.log('');
console.log('📋 Tài khoản demo:');
console.log('  👩‍🏫 Giáo viên : teacher@example.com  / teacher123');
console.log('  👨‍🎓 Học viên A: student_a@example.com / student123');
console.log('  👨‍🎓 Học viên B: student_b@example.com / student123');
console.log('  👨‍🎓 Học viên C: student_c@example.com / student123');
