// js/dashboard.js

utils.requireAuth();

// ─── STATE ────────────────────────────────────────────
let currentUser   = utils.getUser();
let allStudents   = [];
let curriculum    = [];
let currentSection = "overview";

// Target student for teacher view (progress/scores)
let targetStudentId = currentUser?.id;

// ─── INIT ──────────────────────────────────────────────
(async function init() {
  try {
    const me = await api.me();
    currentUser = me.user;
    utils.setUser(currentUser);
  } catch (e) { /* token expired → redirected */ return; }

  // Set sidebar user info
  document.getElementById("user-name").textContent = currentUser.name;
  document.getElementById("user-role").textContent =
    currentUser.role === "teacher" ? "👩‍🏫 Giáo viên" : "👨‍🎓 Học viên";
  document.getElementById("ov-name").textContent = currentUser.name;

  // Show/hide role-based nav items
  document.querySelectorAll(".teacher-only").forEach(el =>
    el.style.display = currentUser.role === "teacher" ? "" : "none"
  );
  document.querySelectorAll(".student-only").forEach(el =>
    el.style.display = currentUser.role === "student" ? "" : "none"
  );

  // Load initial data
  await loadOverview();
})();

// ─── NAVIGATION ────────────────────────────────────────
function nav(section) {
  currentSection = section;

  document.querySelectorAll(".page-section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));

  document.getElementById(`sec-${section}`).classList.add("active");
  document.querySelector(`[data-section="${section}"]`)?.classList.add("active");

  // Lazy-load on first visit
  switch (section) {
    case "overview":    loadOverview();    break;
    case "curriculum":  loadCurriculum();  break;
    case "students":    loadStudents();    break;
    case "profile":     loadProfile();     break;
    case "progress":    loadProgress();    break;
    case "assignments": loadAssignments(); break;
    case "scores":      loadScores();      break;
  }
}

// ─── MODALS ────────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }
document.querySelectorAll(".modal-overlay").forEach(m =>
  m.addEventListener("click", e => { if (e.target === m) m.classList.remove("open"); })
);

// ─── OVERVIEW ──────────────────────────────────────────
async function loadOverview() {
  const el = document.getElementById("overview-content");
  utils.loading(el);

  try {
    if (currentUser.role === "teacher") {
      await renderTeacherOverview(el);
    } else {
      await renderStudentOverview(el);
    }
  } catch (e) {
    utils.error(el, e.message);
  }
}

async function renderTeacherOverview(el) {
  const [studentsData, assignData] = await Promise.all([
    api.getStudents(),
    api.getAssignments(),
  ]);
  const students    = studentsData.data || [];
  const assignments = assignData.data   || [];
  const pending     = assignments.filter(a => !a.submission || a.submission.status === "pending").length;
  const graded      = assignments.filter(a => a.submission?.status === "graded").length;

  el.innerHTML = `
    <div class="grid-4 mb-24">
      <div class="stat-card">
        <div class="stat-num">${students.length}</div>
        <div class="stat-label">Học viên</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">${assignments.length}</div>
        <div class="stat-label">Bài tập</div>
      </div>
      <div class="stat-card">
        <div class="stat-num" style="color:var(--orange)">${pending}</div>
        <div class="stat-label">Chờ nộp</div>
      </div>
      <div class="stat-card">
        <div class="stat-num" style="color:var(--green)">${graded}</div>
        <div class="stat-label">Đã chấm</div>
      </div>
    </div>

    <h3 class="card-title mb-16">Học viên gần đây</h3>
    <div class="grid-3">
      ${students.slice(0,6).map(s => `
        <div class="student-card" onclick="openStudentDetail(${s.id})">
          <div class="student-avatar">👤</div>
          <div class="student-name">${s.name}</div>
          <div class="student-email">${s.email}</div>
          <div class="flex-row">${utils.levelBadge(s.level)}<span class="text-muted">${s.target_country || ''}</span></div>
        </div>
      `).join("")}
    </div>
  `;
}

async function renderStudentOverview(el) {
  const [overviewData, assignData] = await Promise.all([
    api.getStudentOverview(currentUser.id),
    api.getAssignments(),
  ]);
  const ov   = overviewData.data;
  const asgs = assignData.data || [];
  const submitted = asgs.filter(a => a.submission?.status !== "pending").length;

  el.innerHTML = `
    <div class="grid-4 mb-24">
      <div class="stat-card">
        <div class="stat-num" style="color:var(--teal)">${ov.completionRate}%</div>
        <div class="stat-label">Hoàn thành</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">${ov.completedWeeks}<span style="font-size:14px;color:var(--text3)">/${ov.totalWeeks}</span></div>
        <div class="stat-label">Tuần xong</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">${asgs.length}</div>
        <div class="stat-label">Bài tập</div>
      </div>
      <div class="stat-card">
        <div class="stat-num" style="color:var(--green)">${submitted}</div>
        <div class="stat-label">Đã nộp</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title mb-16">📊 Điểm trung bình 4 kỹ năng</div>
        ${renderSkillBars(ov.avgScores)}
      </div>
      <div class="card">
        <div class="card-title mb-16">📝 Bài tập gần nhất</div>
        ${asgs.slice(0,4).map(a => `
          <div class="flex-between mb-16" style="padding-bottom:10px;border-bottom:1px solid var(--border)">
            <div>
              <div style="font-size:13px;font-weight:500">${a.title}</div>
              <div class="text-muted">Tuần ${a.week_number} – Tháng ${a.month_number}</div>
            </div>
            ${utils.statusBadge(a.submission?.status || "pending")}
          </div>
        `).join("") || '<div class="text-muted">Chưa có bài tập.</div>'}
      </div>
    </div>
  `;
}

function renderSkillBars(scores) {
  const skills = [
    { key: "speaking",  label: "🎤 Nói",   val: scores?.speaking  || 0 },
    { key: "listening", label: "👂 Nghe",  val: scores?.listening || 0 },
    { key: "reading",   label: "📖 Đọc",   val: scores?.reading   || 0 },
    { key: "writing",   label: "✍️ Viết",  val: scores?.writing   || 0 },
  ];
  return skills.map(s => `
    <div style="margin-bottom:14px">
      <div class="flex-between mb-16" style="margin-bottom:4px">
        <span style="font-size:12px">${s.label}</span>
        <span class="font-mono" style="font-size:12px;color:${utils.scoreColor(s.val)}">${s.val > 0 ? s.val.toFixed(1) : "—"}</span>
      </div>
      ${utils.scoreBar(s.val)}
    </div>
  `).join("");
}

// ─── CURRICULUM ────────────────────────────────────────
async function loadCurriculum() {
  if (curriculum.length) return; // cached
  const el = document.getElementById("curriculum-content");
  utils.loading(el);
  try {
    const res = await api.getCurriculum();
    curriculum = res.data || [];
    renderCurriculum(el);
  } catch (e) {
    utils.error(el, e.message);
  }
}

function renderCurriculum(el) {
  el.innerHTML = curriculum.map((m, i) => `
    <div style="margin-bottom:16px">
      <div class="month-header-bar" onclick="toggleMonth(${m.id})">
        <div class="month-num-circle">${m.number}</div>
        <div class="month-info">
          <h3>${m.title}</h3>
          <p>${m.description || ""}</p>
        </div>
        <span class="month-theme">${m.theme}</span>
        <span class="month-chevron ${i===0?'open':''}" id="chev-${m.id}">▶</span>
      </div>
      <div class="month-body ${i===0?'open':''}" id="mbody-${m.id}">
        <div class="week-grid">
          ${m.weeks.map(w => `
            <div class="week-card">
              <div class="week-num">Tuần ${w.number}</div>
              <h4>${w.title}</h4>
              <ul class="topic-list">
                ${(w.topics||[]).map(t => `<li>${t}</li>`).join("")}
              </ul>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `).join("");
}

function toggleMonth(id) {
  const body = document.getElementById(`mbody-${id}`);
  const chev = document.getElementById(`chev-${id}`);
  body.classList.toggle("open");
  chev.classList.toggle("open");
}
