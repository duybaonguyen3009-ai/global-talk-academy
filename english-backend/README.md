# 🎓 English Curriculum Backend API

Backend Node.js + Express cho **Giáo Trình Tiếng Anh Giao Tiếp 3 Tháng**.

---

## 🚀 Cài đặt & Chạy

```bash
# 1. Cài dependencies
npm install

# 2. Tạo file .env
cp .env.example .env
# Chỉnh sửa JWT_SECRET thành chuỗi bí mật của bạn

# 3. Seed dữ liệu mẫu (tạo giáo trình + tài khoản demo)
npm run seed

# 4. Chạy server
npm run dev      # development (nodemon)
npm start        # production
```

Server chạy tại: **http://localhost:3000**

---

## 👤 Tài Khoản Demo

| Role       | Email                  | Password     |
|------------|------------------------|--------------|
| 👩‍🏫 Giáo viên | teacher@example.com    | teacher123   |
| 👨‍🎓 Học viên A | student_a@example.com  | student123   |
| 👨‍🎓 Học viên B | student_b@example.com  | student123   |
| 👨‍🎓 Học viên C | student_c@example.com  | student123   |

---

## 📡 API Endpoints

> Tất cả endpoint (trừ auth) yêu cầu header:  
> `Authorization: Bearer <token>`

### 🔐 Auth

| Method | Endpoint              | Mô tả                    | Auth |
|--------|-----------------------|--------------------------|------|
| POST   | /api/auth/register    | Đăng ký tài khoản mới    | ❌   |
| POST   | /api/auth/login       | Đăng nhập                | ❌   |
| GET    | /api/auth/me          | Thông tin user hiện tại  | ✅   |

**Đăng nhập:**
```json
POST /api/auth/login
{
  "email": "teacher@example.com",
  "password": "teacher123"
}
```

---

### 📚 Curriculum

| Method | Endpoint                    | Mô tả                        |
|--------|-----------------------------|------------------------------|
| GET    | /api/curriculum             | Toàn bộ giáo trình 3 tháng  |
| GET    | /api/curriculum/weeks/:id   | Chi tiết một tuần học        |

---

### 👨‍🎓 Students *(giáo viên xem tất cả, học viên chỉ xem bản thân)*

| Method | Endpoint                     | Mô tả                        | Role      |
|--------|------------------------------|------------------------------|-----------|
| GET    | /api/students                | Danh sách tất cả học viên    | Teacher   |
| GET    | /api/students/:id            | Thông tin 1 học viên         | Both      |
| PUT    | /api/students/:id            | Cập nhật hồ sơ học viên      | Both      |
| GET    | /api/students/:id/overview   | Tổng quan tiến độ học viên   | Both      |

**Cập nhật hồ sơ:**
```json
PUT /api/students/2
{
  "level": "intermediate",
  "target_country": "Anh",
  "notes": "Học viên tiến bộ nhanh, cần luyện thêm nghe"
}
```

---

### 📈 Progress *(theo dõi từng tuần/tháng)*

| Method | Endpoint                                    | Mô tả                          |
|--------|---------------------------------------------|--------------------------------|
| GET    | /api/progress/:studentId                    | Tiến độ toàn bộ 12 tuần       |
| PUT    | /api/progress/:studentId/week/:weekId       | Cập nhật tiến độ 1 tuần       |
| GET    | /api/progress/:studentId/month/:monthNumber | Tổng kết 1 tháng              |

**Cập nhật tiến độ tuần:**
```json
PUT /api/progress/2/week/3
{
  "completed": true,
  "speaking_score": 8.5,
  "listening_score": 7.0,
  "reading_score": 9.0,
  "writing_score": 7.5,
  "notes": "Phát âm tốt, cần luyện thêm nghe"
}
```

---

### 📝 Assignments *(bài tập & chấm điểm)*

| Method | Endpoint                           | Mô tả                      | Role     |
|--------|------------------------------------|----------------------------|----------|
| GET    | /api/assignments                   | Danh sách bài tập          | Both     |
| POST   | /api/assignments                   | Tạo bài tập mới            | Teacher  |
| POST   | /api/assignments/:id/submit        | Học viên nộp bài           | Student  |
| PUT    | /api/assignments/:id/grade         | Giáo viên chấm điểm        | Teacher  |
| GET    | /api/assignments/scores/:studentId | Báo cáo điểm học viên      | Both     |

**Tạo bài tập:**
```json
POST /api/assignments
{
  "week_id": 1,
  "student_id": 2,
  "title": "Role-play: Chào hỏi tại sân bay",
  "description": "Thực hành hội thoại check-in tại sân bay với ít nhất 10 lượt trao đổi",
  "due_date": "2024-04-15"
}
```

**Chấm điểm:**
```json
PUT /api/assignments/1/grade
{
  "student_id": 2,
  "score": 8.5,
  "feedback": "Phát âm tốt, ngữ điệu tự nhiên! Cần thêm từ vựng về hành lý."
}
```

---

## 🗄️ Cấu Trúc Database

```
users               — Giáo viên & học viên
student_profiles    — Hồ sơ học viên (level, mục tiêu, ghi chú)
months              — 3 tháng giáo trình
weeks               — 12 tuần học
assignments         — Bài tập được giao
submissions         — Bài nộp & điểm số
progress            — Tiến độ học viên theo tuần
```

---

## 📁 Cấu Trúc Source Code

```
english-backend/
├── src/
│   ├── server.js              ← Entry point
│   ├── routes/
│   │   └── index.js           ← Tất cả routes
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── studentController.js
│   │   ├── progressController.js
│   │   ├── assignmentController.js
│   │   └── curriculumController.js
│   ├── middleware/
│   │   └── auth.js            ← JWT middleware
│   └── db/
│       ├── database.js        ← SQLite setup & schema
│       └── seed.js            ← Dữ liệu mẫu
├── .env.example
├── package.json
└── README.md
```
