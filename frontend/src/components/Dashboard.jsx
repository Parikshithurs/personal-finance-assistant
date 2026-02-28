// Dashboard.jsx - Overview with stats, recent expenses, and quick actions
import React, { useState, useEffect } from 'react';
import { getSummary, getExpenses, getAlerts } from '../api';

const CATEGORY_META = {
    Food: { icon: '🍔', color: 'var(--cat-food)' },
    Transport: { icon: '🚗', color: 'var(--cat-transport)' },
    Shopping: { icon: '🛍️', color: 'var(--cat-shopping)' },
    Bills: { icon: '📄', color: 'var(--cat-bills)' },
    Entertainment: { icon: '🎭', color: '#b06efb' },
    Other: { icon: '📦', color: 'var(--cat-other)' },
};

export default function Dashboard({ refreshKey, onNavigate }) {
    const [summary, setSummary] = useState(null);
    const [recentExpenses, setRecentExpenses] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [summaryRes, expensesRes, alertsRes] = await Promise.all([
                    getSummary(),
                    getExpenses(),
                    getAlerts(),
                ]);
                setSummary(summaryRes.data);
                setRecentExpenses((expensesRes.data.expenses || []).slice(-5).reverse());
                setAlerts(alertsRes.data.alerts || []);
            } catch {
                // backend offline
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [refreshKey]);

    const totalSpent = summary?.total_spent ?? 0;
    const categoryCount = Object.keys(summary?.by_category || {}).length;
    const expenseCount = summary?.expense_count ?? 0;
    const topCategory = summary?.top_category ?? '—';

    if (loading) {
        return (
            <div className="fade-in">
                <div className="page-header">
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Loading your financial overview...</p>
                </div>
                <div className="stats-grid">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="stat-card" style={{ height: 100, background: 'var(--bg-elevated)' }} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title">👋 Welcome to FinanceAI</h1>
                <p className="page-subtitle">
                    Your AI-powered personal finance assistant — track, predict, and stay in control
                </p>
            </div>

            {/* Stat Cards */}
            <div className="stats-grid">
                <div className="stat-card primary">
                    <div className="stat-label">Total Spent (This Month)</div>
                    <div className="stat-value">₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</div>
                    <div className="stat-sub">Across all categories</div>
                </div>
                <div className="stat-card accent">
                    <div className="stat-label">Transactions</div>
                    <div className="stat-value">{expenseCount}</div>
                    <div className="stat-sub">Expenses logged</div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-label">Top Category</div>
                    <div className="stat-value" style={{ fontSize: '1.4rem' }}>{topCategory}</div>
                    <div className="stat-sub">Highest spending</div>
                </div>
                <div className="stat-card danger">
                    <div className="stat-label">Budget Alerts</div>
                    <div className="stat-value">{alerts.length}</div>
                    <div className="stat-sub">{alerts.length > 0 ? 'Budgets exceeded' : 'All budgets safe'}</div>
                </div>
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid-left-heavy" style={{ marginBottom: '1.5rem' }}>
                {/* Category Breakdown */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title"><span className="icon">📊</span> Category Breakdown</h2>
                        <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: '0.8rem' }}
                            onClick={() => onNavigate('charts')}>
                            View Charts →
                        </button>
                    </div>

                    {Object.keys(summary?.by_category || {}).length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📭</div>
                            <div className="empty-title">No expenses yet</div>
                            <div className="empty-desc">Add your first expense to see the breakdown</div>
                            <button className="btn btn-primary" style={{ marginTop: '1rem' }}
                                onClick={() => onNavigate('expenses')}>
                                + Add Expense
                            </button>
                        </div>
                    ) : (
                        <div>
                            {Object.entries(summary.by_category)
                                .sort(([, a], [, b]) => b - a)
                                .map(([cat, amount]) => {
                                    const pct = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
                                    const meta = CATEGORY_META[cat] || CATEGORY_META.Other;
                                    const fillClass = pct > 80 ? 'danger' : pct > 50 ? 'warning' : 'safe';
                                    return (
                                        <div key={cat} style={{ marginBottom: '14px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem' }}>
                                                    <span>{meta.icon}</span>
                                                    <span style={{ color: 'var(--text-primary)' }}>{cat}</span>
                                                </span>
                                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: meta.color }}>
                                                    ₹{amount.toLocaleString('en-IN')}
                                                    <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6 }}>
                                                        ({pct.toFixed(1)}%)
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="progress-bar">
                                                <div
                                                    className={`progress-fill ${fillClass}`}
                                                    style={{ width: `${Math.min(pct, 100)}%`, background: meta.color }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>

                {/* Recent Alerts */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title"><span className="icon">🔔</span> Budget Alerts</h2>
                        {alerts.length > 0 && (
                            <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: '0.8rem' }}
                                onClick={() => onNavigate('alerts')}>
                                All →
                            </button>
                        )}
                    </div>
                    {alerts.length === 0 ? (
                        <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                            <div className="empty-icon">✅</div>
                            <div className="empty-title">All budgets on track!</div>
                            <div className="empty-desc">Set budgets to get alerts when you overspend</div>
                            <button className="btn btn-ghost" style={{ marginTop: '1rem', fontSize: '0.8rem' }}
                                onClick={() => onNavigate('budget')}>
                                Set Budgets →
                            </button>
                        </div>
                    ) : (
                        alerts.slice(0, 4).map((alert, i) => (
                            <div key={i} className={`alert ${alert.severity === 'danger' ? 'alert-danger' : 'alert-warning'}`}>
                                <span className="alert-icon">{alert.severity === 'danger' ? '🚨' : '⚠️'}</span>
                                <div className="alert-content">
                                    <div className="alert-title">{alert.category} Budget Alert</div>
                                    <div className="alert-desc">{alert.message}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Recent Expenses */}
            <div className="card fade-in">
                <div className="card-header">
                    <h2 className="card-title"><span className="icon">🕐</span> Recent Expenses</h2>
                    <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: '0.8rem' }}
                        onClick={() => onNavigate('expenses')}>
                        View All →
                    </button>
                </div>

                {recentExpenses.length === 0 ? (
                    <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                        <div className="empty-icon">💸</div>
                        <div className="empty-title">No expenses recorded yet</div>
                        <div className="empty-desc">Start adding expenses to track your spending</div>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentExpenses.map((exp) => {
                                    const catKey = exp.category?.toLowerCase();
                                    return (
                                        <tr key={exp.id}>
                                            <td style={{ fontWeight: 500 }}>{exp.description}</td>
                                            <td>
                                                <span className={`badge badge-${catKey}`}>
                                                    {CATEGORY_META[exp.category]?.icon} {exp.category}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 700, color: 'var(--accent)' }}>
                                                ₹{Number(exp.amount).toLocaleString('en-IN')}
                                            </td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                                {new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
