// js/utils.js
const utils = {
  getUser() {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  },
  setUser(u) { localStorage.setItem("user", JSON.stringify(u)); },
  getToken() { return localStorage.getItem("token"); },
  setToken(t) { localStorage.setItem("token", t); },
  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/index.html";
  },
  requireAuth() {
    if (!this.getToken()) { window.location.href = "/index.html"; }
  },
  redirectIfAuthed() {
    if (this.getToken()) { window.location.href = "/dashboard.html"; }
  },

  toast(msg, type = "info") {
    const el = document.createElement("div");
    el.className = `toast toast--${type}`;
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add("toast--show"));
    setTimeout(() => {
      el.classList.remove("toast--show");
      setTimeout(() => el.remove(), 300);
    }, 3200);
  },

  loading(container, msg = "Đang tải...") {
    container.innerHTML = `<div class="loader-wrap"><span class="spinner"></span><span>${msg}</span></div>`;
  },

  error(container, msg) {
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠️</span><p>${msg}</p></div>`;
  },

  empty(container, msg = "Không có dữ liệu.") {
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">📭</span><p>${msg}</p></div>`;
  },

  scoreColor(s) {
    if (s >= 8)  return "var(--green)";
    if (s >= 6)  return "var(--gold)";
    if (s >= 4)  return "var(--orange)";
    return "var(--red)";
  },

  levelBadge(level) {
    const map = {
      beginner:     { label: "Beginner",     color: "#6c8ebf" },
      elementary:   { label: "Elementary",   color: "#82b366" },
      intermediate: { label: "Intermediate", color: "#d6b656" },
      advanced:     { label: "Advanced",     color: "#ae4132" },
    };
    const d = map[level] || { label: level, color: "#888" };
    return `<span class="badge" style="background:${d.color}20;color:${d.color};border-color:${d.color}40">${d.label}</span>`;
  },

  statusBadge(status) {
    const map = {
      pending:   { label: "Chờ nộp",    color: "#888" },
      submitted: { label: "Đã nộp",     color: "#6c8ebf" },
      graded:    { label: "Đã chấm",    color: "#82b366" },
    };
    const d = map[status] || { label: status, color: "#888" };
    return `<span class="badge" style="background:${d.color}20;color:${d.color};border-color:${d.color}40">${d.label}</span>`;
  },

  formatDate(str) {
    if (!str) return "—";
    return new Date(str).toLocaleDateString("vi-VN");
  },

  scoreBar(score, max = 10) {
    const pct = (score / max) * 100;
    const color = utils.scoreColor(score);
    return `<div class="score-bar-wrap">
      <div class="score-bar" style="width:${pct}%;background:${color}"></div>
    </div>`;
  },
};
