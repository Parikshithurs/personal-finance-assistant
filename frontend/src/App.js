// App.js - Main application component with tab-based navigation
import React, { useState, useEffect, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import './index.css';

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

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alertCount, setAlertCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // Refresh child components when data changes
  const triggerRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  // Poll alert count every 30 seconds
  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        const res = await getAlerts();
        setAlertCount(res.data.alerts?.length || 0);
      } catch {
        /* backend may not be running yet */
      }
    };
    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 30000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard refreshKey={refreshKey} onNavigate={setActiveTab} />;
      case 'expenses':
        return (
          <div className="grid-left-heavy fade-in">
            <ExpenseForm onExpenseAdded={triggerRefresh} />
            <ExpenseList refreshKey={refreshKey} />
          </div>
        );
      case 'charts':
        return <Charts refreshKey={refreshKey} />;
      case 'budget':
        return <BudgetForm onBudgetSet={triggerRefresh} refreshKey={refreshKey} />;
      case 'alerts':
        return <Alerts refreshKey={refreshKey} />;
      default:
        return null;
    }
  };

  return (
    <div className="app">
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            fontSize: '0.875rem',
            fontFamily: 'Inter, sans-serif',
          },
          success: { iconTheme: { primary: '#06d6a0', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ff5e7d', secondary: '#fff' } },
        }}
      />

      {/* Header */}
      <header className="header">
        <div className="header-inner">
          {/* Logo */}
          <div className="logo">
            <div className="logo-icon">💰</div>
            <span className="logo-text">Personal Finance Assistant</span>
          </div>

          {/* Navigation */}
          <nav className="nav">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                className={`nav-btn ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
                id={`nav-${item.id}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {item.id === 'alerts' && alertCount > 0 && (
                  <span style={{
                    background: 'var(--danger)',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    minWidth: '18px',
                    textAlign: 'center',
                  }}>
                    {alertCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Live status */}
          <div className="header-meta">
            <div className="live-badge">
              <span className="live-dot" />
              LIVE
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
