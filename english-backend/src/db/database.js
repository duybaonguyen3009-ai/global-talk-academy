// src/db/database.js
const Database = require("better-sqlite3");
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './database.sqlite';
const db = new Database(path.resolve(DB_PATH));

// Enable WAL mode for better performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ─── CREATE TABLES ─────────────────────────────────────────────
db.exec(`
  -- Users (teachers & students)
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    email       TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,
    role        TEXT    NOT NULL CHECK(role IN ('teacher','student')),
    avatar      TEXT,
    created_at  TEXT    DEFAULT (datetime('now')),
    updated_at  TEXT    DEFAULT (datetime('now'))
  );

  -- Students extra profile
  CREATE TABLE IF NOT EXISTS student_profiles (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    teacher_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
    level           TEXT    DEFAULT 'beginner',
    start_date      TEXT,
    target_country  TEXT,
    notes           TEXT,
    created_at      TEXT    DEFAULT (datetime('now'))
  );

  -- Curriculum months
  CREATE TABLE IF NOT EXISTS months (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    number      INTEGER NOT NULL UNIQUE,
    title       TEXT    NOT NULL,
    theme       TEXT    NOT NULL,
    description TEXT
  );

  -- Curriculum weeks
  CREATE TABLE IF NOT EXISTS weeks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    month_id    INTEGER NOT NULL REFERENCES months(id) ON DELETE CASCADE,
    number      INTEGER NOT NULL UNIQUE,
    title       TEXT    NOT NULL,
    topics      TEXT    NOT NULL  -- JSON array
  );

  -- Assignments
  CREATE TABLE IF NOT EXISTS assignments (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    week_id      INTEGER NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
    teacher_id   INTEGER NOT NULL REFERENCES users(id),
    student_id   INTEGER NOT NULL REFERENCES users(id),
    title        TEXT    NOT NULL,
    description  TEXT,
    due_date     TEXT,
    created_at   TEXT    DEFAULT (datetime('now'))
  );

  -- Assignment submissions & scores
  CREATE TABLE IF NOT EXISTS submissions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id    INTEGER NOT NULL REFERENCES users(id),
    content       TEXT,
    score         REAL    CHECK(score >= 0 AND score <= 10),
    feedback      TEXT,
    status        TEXT    DEFAULT 'pending' CHECK(status IN ('pending','submitted','graded')),
    submitted_at  TEXT,
    graded_at     TEXT,
    created_at    TEXT    DEFAULT (datetime('now'))
  );

  -- Weekly progress tracking
  CREATE TABLE IF NOT EXISTS progress (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_id       INTEGER NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
    completed     INTEGER DEFAULT 0,  -- 0 or 1
    speaking_score   REAL DEFAULT 0,
    listening_score  REAL DEFAULT 0,
    reading_score    REAL DEFAULT 0,
    writing_score    REAL DEFAULT 0,
    notes         TEXT,
    updated_at    TEXT    DEFAULT (datetime('now')),
    UNIQUE(student_id, week_id)
  );
`);

module.exports = db;
