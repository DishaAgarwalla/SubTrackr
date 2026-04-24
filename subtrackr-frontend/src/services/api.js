import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('subtrackr_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('subtrackr_token');
      localStorage.removeItem('subtrackr_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login:    (data) => API.post('/auth/login', data),
  me:       ()     => API.get('/auth/me'),
};

// ── Subscriptions ─────────────────────────────────────────
export const subscriptionAPI = {
  getAll:      (params) => API.get('/subscriptions', { params }),
  getOne:      (id)     => API.get(`/subscriptions/${id}`),
  create:      (data)   => API.post('/subscriptions', data),
  update:      (id, data) => API.put(`/subscriptions/${id}`, data),
  remove:      (id)     => API.delete(`/subscriptions/${id}`),
  logUsage:    (id)     => API.post(`/subscriptions/${id}/log-usage`),
  getCategories: ()     => API.get('/subscriptions/categories'),
};

// ── Dashboard ─────────────────────────────────────────────
export const dashboardAPI = {
  getSummary:        () => API.get('/dashboard/summary'),
  getSpendingHistory:() => API.get('/dashboard/spending-history'),
  getInsights:       () => API.get('/dashboard/insights'),
};

// ── Alerts ────────────────────────────────────────────────
export const alertAPI = {
  getAll:     () => API.get('/alerts'),
  markRead:   (id) => API.put(`/alerts/${id}/read`),
  markAllRead:()   => API.put('/alerts/read-all'),
  delete:     (id) => API.delete(`/alerts/${id}`),
};

// ── User ──────────────────────────────────────────────────
export const userAPI = {
  updateProfile:  (data) => API.put('/user/profile', data),
  changePassword: (data) => API.put('/user/change-password', data),
  upgrade:        ()     => API.post('/user/upgrade'),
};

export default API;
