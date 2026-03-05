// js/api.js  –  Central API client
const BASE_URL = window.location.origin;

const api = {
  _token() {
    return localStorage.getItem("token");
  },

  _headers(extra = {}) {
    const h = { "Content-Type": "application/json", ...extra };
    const t = this._token();
    if (t) h["Authorization"] = `Bearer ${t}`;
    return h;
  },

  async _request(method, path, body) {
    const opts = { method, headers: this._headers() };
    if (body !== undefined) opts.body = JSON.stringify(body);

    let res;
    try {
      res = await fetch(/api/auth/login);
    } catch (e) {
      throw new Error("Không thể kết nối server. Hãy chắc chắn backend đang chạy tại " + BASE_URL);
    }

    if (res.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/index.html";
      return;
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
  },

  get:    (path)        => api._request("GET",    path),
  post:   (path, body)  => api._request("POST",   path, body),
  put:    (path, body)  => api._request("PUT",    path, body),
  delete: (path)        => api._request("DELETE", path),

  // ── auth
  login:    (email, password) => api.post("/api/auth/login",    { email, password }),
  register: (name, email, password, role) => api.post("/api/auth/register", { name, email, password, role }),
  me:       ()                => api.get("/api/auth/me"),

  // ── curriculum
  getCurriculum: ()   => api.get("/api/curriculum"),
  getWeek:       (id) => api.get(`/api/curriculum/weeks/${id}`),

  // ── students
  getStudents:       ()     => api.get("/api/students"),
  getStudent:        (id)   => api.get(`/api/students/${id}`),
  updateStudent:     (id, body) => api.put(`/api/students/${id}`, body),
  getStudentOverview:(id)   => api.get(`/api/students/${id}/overview`),

  // ── progress
  getProgress:       (sid)          => api.get(`/api/progress/${sid}`),
  updateWeekProgress:(sid, wid, body) => api.put(`/api/progress/${sid}/week/${wid}`, body),
  getMonthSummary:   (sid, mnum)    => api.get(`/api/progress/${sid}/month/${mnum}`),

  // ── assignments
  getAssignments:    (params = "")  => api.get(`/api/assignments${params}`),
  createAssignment:  (body)         => api.post("/api/assignments", body),
  submitAssignment:  (id, content)  => api.post(`/api/assignments/${id}/submit`, { content }),
  gradeAssignment:   (id, body)     => api.put(`/api/assignments/${id}/grade`, body),
  getScoreReport:    (sid)          => api.get(`/api/assignments/scores/${sid}`),
};
