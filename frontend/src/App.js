// App.js - Main application component with authentication gate
import React, { useState, useEffect, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import './index.css';

import { AuthProvider, useAuth } from './AuthContext';
import LoginPage from './components/LoginPage';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import Charts from './components/Charts';
import Alerts from './components/Alerts';
import BudgetForm from './components/BudgetForm';
import Dashboard from './components/Dashboard';

import { getAlerts } from './api';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'expenses', label: 'Expenses', icon: '💳' },
  { id: 'charts', label: 'Analytics', icon: '📈' },
  { id: 'budget', label: 'Budgets', icon: '🎯' },
  { id: 'alerts', label: 'Alerts', icon: '🔔' },
];

// ─── Inner app (only rendered when authenticated) ────────────────
function MainApp() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alertCount, setAlertCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        const res = await getAlerts();
        setAlertCount(res.data.alerts?.length || 0);
      } catch { /* backend may not be running yet */ }
    };
    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 30000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard refreshKey={refreshKey} onNavigate={setActiveTab} />;
      case 'expenses':
        return (
          <div className="grid-left-heavy fade-in">
            <ExpenseForm onExpenseAdded={triggerRefresh} />
            <ExpenseList refreshKey={refreshKey} />
          </div>
        );
      case 'charts': return <Charts refreshKey={refreshKey} />;
      case 'budget': return <BudgetForm onBudgetSet={triggerRefresh} refreshKey={refreshKey} />;
      case 'alerts': return <Alerts refreshKey={refreshKey} />;
      default: return null;
    }
  };

  // User initials for avatar
  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '??';

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          {/* Logo */}
          <div className="logo">
            <div className="logo-icon">💰</div>
            <span className="logo-text">Personal Finance Assistant</span>
          </div>

          {/* Navigation */}
          <nav className="nav">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`nav-btn ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
                id={`nav-${item.id}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {item.id === 'alerts' && alertCount > 0 && (
                  <span className="alert-badge">{alertCount}</span>
                )}
              </button>
            ))}
          </nav>

          {/* User area */}
          <div className="header-user-area">
            {/* Live badge */}
            <div className="live-badge">
              <span className="live-dot" />
              LIVE
            </div>

            {/* Avatar + username */}
            <div className="user-chip">
              <div className="user-avatar">{initials}</div>
              <span className="user-name">{user?.username || 'User'}</span>
            </div>

            {/* Logout button */}
            <button
              id="btn-logout"
              className="btn-logout"
              onClick={logout}
              title="Sign out"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        {renderContent()}
      </main>
    </div>
  );
}

// ─── Root App: wraps everything with AuthProvider + single Toaster ─
function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="splash-screen">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>💰</div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Loading…</p>
        </div>
      </div>
    );
  }

  return user ? <MainApp /> : <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      {/* Single Toaster at root so toasts survive page transitions */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e2040',
            color: '#f0f0ff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            fontSize: '0.875rem',
            fontFamily: 'Inter, sans-serif',
          },
          success: { iconTheme: { primary: '#06d6a0', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ff5e7d', secondary: '#fff' } },
        }}
      />
      <AppRouter />
    </AuthProvider>
  );
}
