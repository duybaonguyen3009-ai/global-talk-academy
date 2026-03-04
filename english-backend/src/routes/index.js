// src/routes/index.js
const router = require('express').Router();
const auth   = require('../middleware/auth');

const authCtrl       = require('../controllers/authController');
const studentCtrl    = require('../controllers/studentController');
const progressCtrl   = require('../controllers/progressController');
const assignCtrl     = require('../controllers/assignmentController');
const curriculumCtrl = require('../controllers/curriculumController');

// ── AUTH ──────────────────────────────────────────────
router.post('/auth/register', authCtrl.register);
router.post('/auth/login',    authCtrl.login);
router.get ('/auth/me',       auth(), authCtrl.me);

// ── CURRICULUM (public after login) ──────────────────
router.get('/curriculum',          auth(), curriculumCtrl.getCurriculum);
router.get('/curriculum/weeks/:id', auth(), curriculumCtrl.getWeek);

// ── STUDENTS ─────────────────────────────────────────
router.get ('/students',          auth(['teacher']),          studentCtrl.getAllStudents);
router.get ('/students/:id',      auth(),                     studentCtrl.getStudent);
router.put ('/students/:id',      auth(),                     studentCtrl.updateStudent);
router.get ('/students/:id/overview', auth(),                 studentCtrl.getStudentOverview);

// ── PROGRESS ─────────────────────────────────────────
router.get ('/progress/:studentId',                    auth(), progressCtrl.getProgress);
router.put ('/progress/:studentId/week/:weekId',       auth(), progressCtrl.updateWeekProgress);
router.get ('/progress/:studentId/month/:monthNumber', auth(), progressCtrl.getMonthSummary);

// ── ASSIGNMENTS ───────────────────────────────────────
router.get ('/assignments',                    auth(),             assignCtrl.getAssignments);
router.post('/assignments',                    auth(['teacher']),  assignCtrl.createAssignment);
router.post('/assignments/:id/submit',         auth(['student']),  assignCtrl.submitAssignment);
router.put ('/assignments/:id/grade',          auth(['teacher']),  assignCtrl.gradeAssignment);
router.get ('/assignments/scores/:studentId',  auth(),             assignCtrl.getScoreReport);

module.exports = router;
