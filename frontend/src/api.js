// api.js - Centralized API calls to the Flask backend (JWT auth aware)
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: attach JWT token ───────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fa_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: handle 401 (token expired / invalid) ──
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fa_token');
      localStorage.removeItem('fa_user');
      window.dispatchEvent(new Event('fa_unauthorized'));
    }
    return Promise.reject(err);
  }
);

// ─── Auth API ───────────────────────────────────────────────────
export const registerUser = (data) => api.post('/register', data);
export const loginUser = (data) => api.post('/login', data);
export const getMe = () => api.get('/me');

// ─── Expense API ────────────────────────────────────────────────
export const predictCategory = (description) =>
  api.post('/predict', { description });

export const addExpense = (data) => api.post('/expense', data);
export const getExpenses = () => api.get('/expenses');
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);

// ─── Summary & Budget API ───────────────────────────────────────
export const getSummary = () => api.get('/summary');
export const setBudget = (data) => api.post('/budget', data);
export const getAlerts = () => api.get('/alerts');
export const getBudgets = () => api.get('/budgets');

export default api;
