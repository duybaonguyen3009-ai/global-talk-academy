// js/students-progress.js  — appended logic

// ─── STUDENTS (teacher) ────────────────────────────────
async function loadStudents() {
  const el = document.getElementById("students-content");
  utils.loading(el);
  try {
    const res  = await api.getStudents();
    allStudents = res.data || [];
    renderStudentsList(el);
  } catch (e) {
    utils.error(el, e.message);
  }
}

function renderStudentsList(el) {
  if (!allStudents.length) { utils.empty(el, "Chưa có học viên nào."); return; }
  el.innerHTML = `
    <div class="grid-3">
      ${allStudents.map(s => `
        <div class="student-card" onclick="openStudentDetail(${s.id})">
          <div class="student-avatar">👤</div>
          <div class="student-name">${s.name}</div>
          <div class="student-email">${s.email}</div>
          <div class="flex-row" style="flex-wrap:wrap;gap:6px;margin-bottom:8px">
            ${utils.levelBadge(s.level)}
            ${s.target_country ? `<span class="tag">✈ ${s.target_country}</span>` : ""}
          </div>
          <div class="text-muted">Tham gia: ${utils.formatDate(s.created_at)}</div>
        </div>
      `).join("")}
    </div>
  `;
}

async function openStudentDetail(id) {
  const body = document.getElementById("modal-student-body");
  body.innerHTML = `<div class="loader-wrap"><span class="spinner"></span> Đang tải...</div>`;
  openModal("modal-student");

  try {
    const [studentRes, overviewRes] = await Promise.all([
      api.getStudent(id),
      api.getStudentOverview(id),
    ]);
    const s  = studentRes.data;
    const ov = overviewRes.data;

    body.innerHTML = `
      <div class="flex-row mb-24" style="gap:16px;align-items:flex-start">
        <div style="font-size:48px">👤</div>
        <div>
          <div style="font-size:18px;font-weight:700;font-family:'Lora',serif">${s.name}</div>
          <div class="text-muted">${s.email}</div>
          <div class="flex-row" style="margin-top:8px;flex-wrap:wrap;gap:6px">
            ${utils.levelBadge(s.level)}
            ${s.target_country ? `<span class="tag">✈ ${s.target_country}</span>` : ""}
          </div>
        </div>
      </div>

      <div class="grid-4 mb-24">
        <div class="stat-card">
          <div class="stat-num" style="color:var(--teal)">${ov.completionRate}%</div>
          <div class="stat-label">Hoàn thành</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">${ov.completedWeeks}/${ov.totalWeeks}</div>
          <div class="stat-label">Tuần xong</div>
        </div>
        <div class="stat-card">
          <div class="stat-num" style="color:var(--gold)">${ov.avgScores.speaking}</div>
          <div class="stat-label">Nói TB</div>
        </div>
        <div class="stat-card">
          <div class="stat-num" style="color:var(--gold)">${ov.avgScores.listening}</div>
          <div class="stat-label">Nghe TB</div>
        </div>
      </div>

      ${s.notes ? `<div class="card mb-24"><div class="card-title">📋 Ghi chú</div><p style="font-size:13px;color:var(--text2);margin-top:8px">${s.notes}</p></div>` : ""}

      <hr class="divider">
      <h4 style="font-size:13px;font-weight:600;color:var(--text2);margin-bottom:12px;text-transform:uppercase;letter-spacing:1px">Chỉnh sửa hồ sơ</h4>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Trình độ</label>
          <select class="form-select" id="edit-level-${id}">
            <option value="beginner"     ${s.level==='beginner'?'selected':''}>Beginner</option>
            <option value="elementary"   ${s.level==='elementary'?'selected':''}>Elementary</option>
            <option value="intermediate" ${s.level==='intermediate'?'selected':''}>Intermediate</option>
            <option value="advanced"     ${s.level==='advanced'?'selected':''}>Advanced</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Mục tiêu (quốc gia)</label>
          <input class="form-input" id="edit-country-${id}" value="${s.target_country||''}" placeholder="UK, US, Úc...">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Ghi chú</label>
        <textarea class="form-textarea" id="edit-notes-${id}" placeholder="Ghi chú về học viên...">${s.notes||''}</textarea>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal('modal-student')">Đóng</button>
        <button class="btn btn-primary" onclick="saveStudentEdit(${id})">Lưu thay đổi</button>
      </div>
    `;
  } catch (e) {
    body.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠️</span><p>${e.message}</p></div>`;
  }
}

async function saveStudentEdit(id) {
  const level          = document.getElementById(`edit-level-${id}`).value;
  const target_country = document.getElementById(`edit-country-${id}`).value.trim();
  const notes          = document.getElementById(`edit-notes-${id}`).value.trim();
  try {
    await api.updateStudent(id, { level, target_country, notes });
    utils.toast("Cập nhật thành công!", "success");
    closeModal("modal-student");
    loadStudents();
  } catch (e) {
    utils.toast(e.message, "error");
  }
}

// ─── PROFILE (student) ─────────────────────────────────
async function loadProfile() {
  const el = document.getElementById("profile-content");
  utils.loading(el);
  try {
    const res = await api.getStudent(currentUser.id);
    const s   = res.data;
    el.innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-title mb-24">👤 Thông tin cá nhân</div>
          <div class="form-group">
            <label class="form-label">Họ tên</label>
            <input class="form-input" value="${currentUser.name}" disabled>
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-input" value="${currentUser.email}" disabled>
          </div>
          <div class="form-group">
            <label class="form-label">Trình độ</label>
            <select class="form-select" id="p-level">
              <option value="beginner"     ${s.level==='beginner'?'selected':''}>Beginner</option>
              <option value="elementary"   ${s.level==='elementary'?'selected':''}>Elementary</option>
              <option value="intermediate" ${s.level==='intermediate'?'selected':''}>Intermediate</option>
              <option value="advanced"     ${s.level==='advanced'?'selected':''}>Advanced</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Quốc gia mục tiêu</label>
            <input class="form-input" id="p-country" value="${s.target_country||''}" placeholder="UK, US, Úc...">
          </div>
          <div class="form-group">
            <label class="form-label">Ghi chú mục tiêu</label>
            <textarea class="form-textarea" id="p-notes" placeholder="Mục tiêu, kỳ vọng...">${s.notes||''}</textarea>
          </div>
          <button class="btn btn-primary" onclick="saveProfile()">💾 Lưu hồ sơ</button>
        </div>

        <div class="card">
          <div class="card-title mb-16">📊 Thống kê học tập</div>
          <div id="profile-stats"></div>
        </div>
      </div>
    `;
    loadProfileStats();
  } catch (e) {
    utils.error(el, e.message);
  }
}

async function loadProfileStats() {
  const el = document.getElementById("profile-stats");
  if (!el) return;
  try {
    const res = await api.getStudentOverview(currentUser.id);
    const ov  = res.data;
    el.innerHTML = `
      <div class="grid-2 mb-24">
        <div class="stat-card"><div class="stat-num" style="color:var(--teal)">${ov.completionRate}%</div><div class="stat-label">Hoàn thành</div></div>
        <div class="stat-card"><div class="stat-num">${ov.completedWeeks}/${ov.totalWeeks}</div><div class="stat-label">Tuần học</div></div>
      </div>
      <div class="card-title mb-16">🎯 Điểm trung bình</div>
      ${renderSkillBars(ov.avgScores)}
    `;
  } catch {}
}

async function saveProfile() {
  const level          = document.getElementById("p-level").value;
  const target_country = document.getElementById("p-country").value.trim();
  const notes          = document.getElementById("p-notes").value.trim();
  try {
    await api.updateStudent(currentUser.id, { level, target_country, notes });
    utils.toast("Hồ sơ đã được cập nhật!", "success");
  } catch (e) {
    utils.toast(e.message, "error");
  }
}

// ─── PROGRESS ──────────────────────────────────────────
let progressStudentId = null;

async function loadProgress() {
  const selectorEl = document.getElementById("progress-student-selector");
  const contentEl  = document.getElementById("progress-content");

  if (currentUser.role === "teacher") {
    // Teacher: show student picker
    try {
      if (!allStudents.length) {
        const res = await api.getStudents();
        allStudents = res.data || [];
      }
      if (!progressStudentId && allStudents.length) progressStudentId = allStudents[0].id;
      selectorEl.innerHTML = `
        <select class="form-select" onchange="progressStudentId=Number(this.value);fetchProgress()" style="min-width:200px">
          ${allStudents.map(s => `<option value="${s.id}" ${s.id===progressStudentId?'selected':''}>${s.name}</option>`).join("")}
        </select>
      `;
    } catch {}
  } else {
    progressStudentId = currentUser.id;
    selectorEl.innerHTML = "";
  }

  await fetchProgress();
}

async function fetchProgress() {
  const el = document.getElementById("progress-content");
  if (!progressStudentId) { utils.empty(el, "Chọn học viên để xem tiến độ."); return; }
  utils.loading(el);
  try {
    const res     = await api.getProgress(progressStudentId);
    const months  = res.data || [];
    renderProgress(el, months);
  } catch (e) {
    utils.error(el, e.message);
  }
}

function renderProgress(el, months) {
  const totalW    = months.reduce((a, m) => a + m.weeks.length, 0);
  const doneW     = months.reduce((a, m) => a + m.weeks.filter(w => w.completed).length, 0);
  const pct       = totalW ? Math.round((doneW / totalW) * 100) : 0;

  el.innerHTML = `
    <div class="card mb-24">
      <div class="flex-between">
        <div>
          <div class="card-title">Tiến độ tổng thể</div>
          <div class="text-muted">${doneW}/${totalW} tuần hoàn thành</div>
        </div>
        <div style="text-align:center">
          <div style="font-family:'Lora',serif;font-size:36px;font-weight:700;color:${pct>=80?'var(--green)':pct>=50?'var(--gold)':'var(--teal)'}">${pct}%</div>
        </div>
      </div>
      <div style="height:8px;background:var(--border);border-radius:4px;margin-top:14px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:var(--gold);border-radius:4px;transition:width .6s"></div>
      </div>
    </div>

    ${months.map(m => `
      <div class="progress-month">
        <div class="progress-month-title">${m.title}</div>
        ${m.weeks.map(w => `
          <div class="week-progress-row" onclick="openWeekProgressModal(${progressStudentId}, ${w.id}, '${w.title.replace(/'/g,"\\'")}', ${JSON.stringify(w.scores).replace(/"/g,"'")}, ${w.completed}, '${(w.notes||'').replace(/'/g,"\\'")}')">
            <div class="week-check ${w.completed ? 'done' : ''}">
              ${w.completed ? '✓' : ''}
            </div>
            <div class="week-progress-info">
              <div class="wnum font-mono">Tuần ${w.number}</div>
              <div class="wt">${w.title}</div>
            </div>
            <div class="week-scores">
              ${w.scores.speaking  > 0 ? `<span class="score-pill">🎤 ${w.scores.speaking}</span>`  : ""}
              ${w.scores.listening > 0 ? `<span class="score-pill">👂 ${w.scores.listening}</span>` : ""}
              ${w.scores.reading   > 0 ? `<span class="score-pill">📖 ${w.scores.reading}</span>`   : ""}
              ${w.scores.writing   > 0 ? `<span class="score-pill">✍️ ${w.scores.writing}</span>`   : ""}
            </div>
            <button class="btn btn-teal btn-sm">Cập nhật</button>
          </div>
        `).join("")}
      </div>
    `).join("")}
  `;
}

function openWeekProgressModal(studentId, weekId, title, scores, completed, notes) {
  const body = document.getElementById("modal-progress-body");
  body.innerHTML = `
    <p style="font-size:13px;color:var(--text2);margin-bottom:16px">${title}</p>
    <div class="form-group">
      <label class="form-label">Trạng thái</label>
      <select class="form-select" id="wpm-completed">
        <option value="0" ${!completed?'selected':''}>⏳ Chưa hoàn thành</option>
        <option value="1" ${completed?'selected':''}>✅ Hoàn thành</option>
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">🎤 Nói (0–10)</label>
        <input class="form-input" type="number" id="wpm-sp" min="0" max="10" step="0.5" value="${scores.speaking||''}">
      </div>
      <div class="form-group">
        <label class="form-label">👂 Nghe (0–10)</label>
        <input class="form-input" type="number" id="wpm-li" min="0" max="10" step="0.5" value="${scores.listening||''}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">📖 Đọc (0–10)</label>
        <input class="form-input" type="number" id="wpm-re" min="0" max="10" step="0.5" value="${scores.reading||''}">
      </div>
      <div class="form-group">
        <label class="form-label">✍️ Viết (0–10)</label>
        <input class="form-input" type="number" id="wpm-wr" min="0" max="10" step="0.5" value="${scores.writing||''}">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Ghi chú</label>
      <textarea class="form-textarea" id="wpm-notes">${notes||''}</textarea>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('modal-progress')">Hủy</button>
      <button class="btn btn-primary" onclick="saveWeekProgress(${studentId},${weekId})">💾 Lưu</button>
    </div>
  `;
  openModal("modal-progress");
}

async function saveWeekProgress(studentId, weekId) {
  const payload = {
    completed:       Number(document.getElementById("wpm-completed").value),
    speaking_score:  Number(document.getElementById("wpm-sp").value)  || null,
    listening_score: Number(document.getElementById("wpm-li").value)  || null,
    reading_score:   Number(document.getElementById("wpm-re").value)  || null,
    writing_score:   Number(document.getElementById("wpm-wr").value)  || null,
    notes:           document.getElementById("wpm-notes").value.trim() || null,
  };
  try {
    await api.updateWeekProgress(studentId, weekId, payload);
    utils.toast("Tiến độ đã được cập nhật!", "success");
    closeModal("modal-progress");
    fetchProgress();
  } catch (e) {
    utils.toast(e.message, "error");
  }
}
