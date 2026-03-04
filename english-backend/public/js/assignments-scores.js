// js/assignments-scores.js

// ─── ASSIGNMENTS ───────────────────────────────────────
async function loadAssignments() {
  const el = document.getElementById("assignments-content");
  utils.loading(el);
  try {
    const res  = await api.getAssignments();
    const data = res.data || [];
    renderAssignments(el, data);
  } catch (e) {
    utils.error(el, e.message);
  }
}

function renderAssignments(el, data) {
  if (!data.length) { utils.empty(el, "Chưa có bài tập nào."); return; }

  el.innerHTML = `
    <div class="table-wrap card" style="padding:0;overflow:hidden">
      <table>
        <thead>
          <tr>
            <th>Bài tập</th>
            <th>Tuần / Tháng</th>
            <th>${currentUser.role === "teacher" ? "Học viên" : "Hạn nộp"}</th>
            <th>Trạng thái</th>
            <th>Điểm</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(a => {
            const sub    = a.submission;
            const status = sub?.status || "pending";
            return `
              <tr>
                <td>
                  <div class="td-main">${a.title}</div>
                  ${a.description ? `<div class="text-muted" style="max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${a.description}</div>` : ""}
                </td>
                <td class="font-mono" style="font-size:11px;color:var(--text3)">W${a.week_number} / M${a.month_number}</td>
                <td>${currentUser.role === "teacher" ? `<span style="font-size:13px">${a.student_name}</span>` : utils.formatDate(a.due_date)}</td>
                <td>${utils.statusBadge(status)}</td>
                <td class="font-mono" style="color:${sub?.score != null ? utils.scoreColor(sub.score) : 'var(--text3)'}">
                  ${sub?.score != null ? sub.score.toFixed(1) : "—"}
                </td>
                <td>
                  <div class="flex-row" style="gap:6px">
                    ${currentUser.role === "student" && status === "pending" ? `
                      <button class="btn btn-teal btn-sm" onclick="openSubmitModal(${a.id}, '${a.title.replace(/'/g,"\\'")}')">Nộp bài</button>
                    ` : ""}
                    ${currentUser.role === "teacher" && sub?.status === "submitted" ? `
                      <button class="btn btn-primary btn-sm" onclick="openGradeModal(${a.id}, ${a.student_id}, '${a.title.replace(/'/g,"\\'")}')">Chấm điểm</button>
                    ` : ""}
                    ${sub?.feedback ? `
                      <button class="btn btn-secondary btn-sm" onclick="showFeedback('${(sub.feedback||'').replace(/'/g,"\\'")}')">Nhận xét</button>
                    ` : ""}
                  </div>
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function openSubmitModal(id, title) {
  const body = document.getElementById("modal-submit-body");
  body.innerHTML = `
    <p style="font-size:13px;color:var(--text2);margin-bottom:16px">${title}</p>
    <div class="form-group">
      <label class="form-label">Nội dung bài làm</label>
      <textarea class="form-textarea" id="sub-content" style="min-height:120px" placeholder="Nhập nội dung bài làm của bạn tại đây..."></textarea>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('modal-submit')">Hủy</button>
      <button class="btn btn-primary" onclick="doSubmit(${id})">📤 Nộp bài</button>
    </div>
  `;
  openModal("modal-submit");
}

async function doSubmit(assignmentId) {
  const content = document.getElementById("sub-content").value.trim();
  if (!content) { utils.toast("Vui lòng nhập nội dung bài làm.", "error"); return; }
  try {
    await api.submitAssignment(assignmentId, content);
    utils.toast("Nộp bài thành công! 🎉", "success");
    closeModal("modal-submit");
    loadAssignments();
  } catch (e) {
    utils.toast(e.message, "error");
  }
}

function openGradeModal(assignId, studentId, title) {
  const body = document.getElementById("modal-grade-body");
  body.innerHTML = `
    <p style="font-size:13px;color:var(--text2);margin-bottom:16px">${title}</p>
    <div class="form-group">
      <label class="form-label">Điểm (0 – 10)</label>
      <input class="form-input" type="number" id="grade-score" min="0" max="10" step="0.5" placeholder="8.5">
    </div>
    <div class="form-group">
      <label class="form-label">Nhận xét / Phản hồi</label>
      <textarea class="form-textarea" id="grade-feedback" placeholder="Phát âm tốt, cần luyện thêm từ vựng..."></textarea>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('modal-grade')">Hủy</button>
      <button class="btn btn-primary" onclick="doGrade(${assignId}, ${studentId})">✅ Lưu điểm</button>
    </div>
  `;
  openModal("modal-grade");
}

async function doGrade(assignId, studentId) {
  const score    = Number(document.getElementById("grade-score").value);
  const feedback = document.getElementById("grade-feedback").value.trim();
  if (isNaN(score) || score < 0 || score > 10) { utils.toast("Điểm phải từ 0 đến 10.", "error"); return; }
  try {
    await api.gradeAssignment(assignId, { student_id: studentId, score, feedback });
    utils.toast("Chấm điểm thành công!", "success");
    closeModal("modal-grade");
    loadAssignments();
  } catch (e) {
    utils.toast(e.message, "error");
  }
}

function showFeedback(feedback) {
  const body = document.getElementById("modal-grade-body");
  body.innerHTML = `
    <div class="card" style="background:var(--bg)">
      <p style="font-size:14px;line-height:1.7;color:var(--text2)">${feedback}</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('modal-grade')">Đóng</button>
    </div>
  `;
  openModal("modal-grade");
}

// ── Create assignment modal
async function openCreateAssignment() {
  const body = document.getElementById("modal-assignment-body");

  // Load students & curriculum if needed
  try {
    if (!allStudents.length) {
      const r = await api.getStudents();
      allStudents = r.data || [];
    }
    if (!curriculum.length) {
      const r = await api.getCurriculum();
      curriculum = r.data || [];
    }
  } catch (e) {
    utils.toast(e.message, "error");
    return;
  }

  const allWeeks = curriculum.flatMap(m => m.weeks.map(w => ({ ...w, month: m.number })));

  body.innerHTML = `
    <div class="form-group">
      <label class="form-label">Học viên</label>
      <select class="form-select" id="ca-student">
        ${allStudents.map(s => `<option value="${s.id}">${s.name}</option>`).join("")}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Tuần học</label>
      <select class="form-select" id="ca-week">
        ${allWeeks.map(w => `<option value="${w.id}">T${w.month} – Tuần ${w.number}: ${w.title}</option>`).join("")}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Tiêu đề bài tập</label>
      <input class="form-input" id="ca-title" placeholder="Role-play: Chào hỏi tại sân bay...">
    </div>
    <div class="form-group">
      <label class="form-label">Mô tả</label>
      <textarea class="form-textarea" id="ca-desc" placeholder="Thực hành hội thoại ít nhất 10 lượt trao đổi..."></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Hạn nộp</label>
      <input class="form-input" type="date" id="ca-due">
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('modal-assignment')">Hủy</button>
      <button class="btn btn-primary" onclick="doCreateAssignment()">➕ Tạo bài tập</button>
    </div>
  `;
  openModal("modal-assignment");
}

async function doCreateAssignment() {
  const title      = document.getElementById("ca-title").value.trim();
  const week_id    = Number(document.getElementById("ca-week").value);
  const student_id = Number(document.getElementById("ca-student").value);
  const description= document.getElementById("ca-desc").value.trim();
  const due_date   = document.getElementById("ca-due").value || null;

  if (!title)  { utils.toast("Vui lòng nhập tiêu đề bài tập.", "error"); return; }
  try {
    await api.createAssignment({ week_id, student_id, title, description, due_date });
    utils.toast("Tạo bài tập thành công!", "success");
    closeModal("modal-assignment");
    loadAssignments();
  } catch (e) {
    utils.toast(e.message, "error");
  }
}

// ─── SCORES ────────────────────────────────────────────
let scoresStudentId = null;

async function loadScores() {
  const selectorEl = document.getElementById("scores-student-selector");
  const contentEl  = document.getElementById("scores-content");

  if (currentUser.role === "teacher") {
    try {
      if (!allStudents.length) {
        const res = await api.getStudents();
        allStudents = res.data || [];
      }
      if (!scoresStudentId && allStudents.length) scoresStudentId = allStudents[0].id;
      selectorEl.innerHTML = `
        <select class="form-select" onchange="scoresStudentId=Number(this.value);fetchScores()" style="min-width:200px">
          ${allStudents.map(s => `<option value="${s.id}" ${s.id===scoresStudentId?'selected':''}>${s.name}</option>`).join("")}
        </select>
      `;
    } catch {}
  } else {
    scoresStudentId = currentUser.id;
    selectorEl.innerHTML = "";
  }
  await fetchScores();
}

async function fetchScores() {
  const el = document.getElementById("scores-content");
  if (!scoresStudentId) { utils.empty(el, "Chọn học viên để xem điểm."); return; }
  utils.loading(el);
  try {
    const res  = await api.getScoreReport(scoresStudentId);
    const data = res.data;
    renderScores(el, data);
  } catch (e) {
    utils.error(el, e.message);
  }
}

function renderScores(el, data) {
  el.innerHTML = `
    <div class="score-summary-grid mb-24">
      <div class="score-summary-card">
        <div class="s-num" style="color:var(--text)">${data.total}</div>
        <div class="s-label">Tổng bài tập</div>
      </div>
      <div class="score-summary-card">
        <div class="s-num" style="color:var(--blue)">${data.submitted}</div>
        <div class="s-label">Đã nộp</div>
      </div>
      <div class="score-summary-card">
        <div class="s-num" style="color:var(--green)">${data.graded}</div>
        <div class="s-label">Đã chấm</div>
      </div>
      <div class="score-summary-card">
        <div class="s-num" style="color:${data.averageScore != null ? utils.scoreColor(data.averageScore) : 'var(--text3)'}">
          ${data.averageScore != null ? data.averageScore.toFixed(1) : "—"}
        </div>
        <div class="s-label">Điểm TB</div>
      </div>
    </div>

    <div class="table-wrap card" style="padding:0;overflow:hidden">
      <table>
        <thead>
          <tr>
            <th>Bài tập</th>
            <th>Tuần / Tháng</th>
            <th>Hạn nộp</th>
            <th>Trạng thái</th>
            <th>Điểm</th>
            <th>Nhận xét</th>
          </tr>
        </thead>
        <tbody>
          ${data.assignments.map(a => `
            <tr>
              <td class="td-main">${a.title}</td>
              <td class="font-mono" style="font-size:11px;color:var(--text3)">W${a.week_number} / M${a.month_number}</td>
              <td class="text-muted">${utils.formatDate(a.due_date)}</td>
              <td>${utils.statusBadge(a.status || "pending")}</td>
              <td class="font-mono" style="color:${a.score != null ? utils.scoreColor(a.score) : 'var(--text3)'}">
                ${a.score != null ? a.score.toFixed(1) : "—"}
              </td>
              <td style="max-width:200px">
                ${a.feedback
                  ? `<span style="font-size:12px;color:var(--text2);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${a.feedback}</span>`
                  : `<span class="text-muted">—</span>`}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}
