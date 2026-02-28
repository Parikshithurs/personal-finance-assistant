// api.js - Centralized API calls to the Flask backend
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Predict expense category from description
export const predictCategory = (description) =>
  api.post('/predict', { description });

// Add a new expense
export const addExpense = (data) => api.post('/expense', data);

// Get all expenses
export const getExpenses = () => api.get('/expenses');

// Get monthly spending summary
export const getSummary = () => api.get('/summary');

// Set budget for a category
export const setBudget = (data) => api.post('/budget', data);

// Get all budget alerts
export const getAlerts = () => api.get('/alerts');

// Get all budgets
export const getBudgets = () => api.get('/budgets');

export default api;
