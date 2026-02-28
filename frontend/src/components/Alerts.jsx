// Alerts.jsx - Budget alert notifications with severity levels
import React, { useState, useEffect } from 'react';
import { getAlerts, getSummary, getBudgets } from '../api';

const CATEGORY_META = {
    Food: { icon: '🍔', color: 'var(--cat-food)' },
    Transport: { icon: '🚗', color: 'var(--cat-transport)' },
    Shopping: { icon: '🛍️', color: 'var(--cat-shopping)' },
    Bills: { icon: '📄', color: 'var(--cat-bills)' },
    Entertainment: { icon: '🎭', color: '#b06efb' },
    Other: { icon: '📦', color: 'var(--cat-other)' },
};

export default function Alerts({ refreshKey }) {
    const [alerts, setAlerts] = useState([]);
    const [budgets, setBudgets] = useState({});
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [alertRes, budgetRes, summaryRes] = await Promise.all([
                    getAlerts(),
                    getBudgets(),
                    getSummary(),
                ]);
                setAlerts(alertRes.data.alerts || []);
                setBudgets(budgetRes.data.budgets || {});
                setSummary(summaryRes.data || {});
            } catch {
                setAlerts([]);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [refreshKey]);

    // Budget status cards for each budget set
    const budgetStatuses = Object.entries(budgets).map(([cat, budget]) => {
        const spent = summary?.by_category?.[cat] || 0;
        const pct = budget > 0 ? (spent / budget) * 100 : 0;
        const remaining = budget - spent;
        const status = pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : 'safe';
        return { cat, budget, spent, remaining, pct, status };
    });

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">🔔 Budget Alerts</h1>
                <p className="page-subtitle">Real-time spending alerts and budget health status</p>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <span className="spinner" style={{ width: 28, height: 28, borderColor: 'rgba(108,99,255,0.3)', borderTopColor: 'var(--primary)' }} />
                </div>
            ) : (
                <>
                    {/* Summary Banner */}
                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        marginBottom: '1.5rem',
                        flexWrap: 'wrap',
                    }}>
                        <div style={{
                            flex: '1 1 200px',
                            padding: '1rem 1.5rem',
                            background: alerts.length > 0 ? 'rgba(255,94,125,0.08)' : 'rgba(6,214,160,0.08)',
                            border: `1px solid ${alerts.length > 0 ? 'rgba(255,94,125,0.25)' : 'rgba(6,214,160,0.25)'}`,
                            borderRadius: 'var(--radius-lg)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                        }}>
                            <span style={{ fontSize: '2rem' }}>{alerts.length > 0 ? '🚨' : '✅'}</span>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Active Alerts
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: alerts.length > 0 ? 'var(--danger)' : 'var(--success)' }}>
                                    {alerts.length}
                                </div>
                            </div>
                        </div>

                        <div style={{
                            flex: '1 1 200px',
                            padding: '1rem 1.5rem',
                            background: 'rgba(108,99,255,0.08)',
                            border: '1px solid rgba(108,99,255,0.2)',
                            borderRadius: 'var(--radius-lg)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                        }}>
                            <span style={{ fontSize: '2rem' }}>🎯</span>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Budgets Set
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-light)' }}>
                                    {Object.keys(budgets).length}
                                </div>
                            </div>
                        </div>

                        <div style={{
                            flex: '1 1 200px',
                            padding: '1rem 1.5rem',
                            background: 'rgba(255,190,11,0.08)',
                            border: '1px solid rgba(255,190,11,0.2)',
                            borderRadius: 'var(--radius-lg)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                        }}>
                            <span style={{ fontSize: '2rem' }}>⚠️</span>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Near Limit
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning)' }}>
                                    {budgetStatuses.filter(b => b.status === 'warning').length}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Active Alerts */}
                    {alerts.length > 0 && (
                        <div className="card" style={{ marginBottom: '1.5rem' }}>
                            <div className="card-header">
                                <h2 className="card-title"><span className="icon">🚨</span> Active Alerts</h2>
                                <span style={{
                                    padding: '3px 10px',
                                    background: 'rgba(255,94,125,0.15)',
                                    border: '1px solid rgba(255,94,125,0.3)',
                                    borderRadius: '20px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    color: 'var(--danger)',
                                }}>
                                    {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            {alerts.map((alert, i) => {
                                const isCritical = alert.severity === 'danger' || alert.exceeded_by > 0;
                                return (
                                    <div key={i} className={`alert ${isCritical ? 'alert-danger' : 'alert-warning'}`}>
                                        <span className="alert-icon">{isCritical ? '🚨' : '⚠️'}</span>
                                        <div className="alert-content">
                                            <div className="alert-title">
                                                {CATEGORY_META[alert.category]?.icon} {alert.category} — Budget Exceeded
                                            </div>
                                            <div className="alert-desc">{alert.message}</div>
                                            {alert.spent != null && alert.budget != null && (
                                                <div style={{ marginTop: 8 }}>
                                                    <div className="progress-bar">
                                                        <div
                                                            className="progress-fill danger"
                                                            style={{ width: `${Math.min((alert.spent / alert.budget) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        <span>Spent: ₹{Number(alert.spent).toLocaleString('en-IN')}</span>
                                                        <span>Budget: ₹{Number(alert.budget).toLocaleString('en-IN')}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Budget Health Overview */}
                    {budgetStatuses.length > 0 && (
                        <div className="card">
                            <div className="card-header">
                                <h2 className="card-title"><span className="icon">💊</span> Budget Health Overview</h2>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                {budgetStatuses.map(({ cat, budget, spent, remaining, pct, status }) => {
                                    const meta = CATEGORY_META[cat] || CATEGORY_META.Other;
                                    const statusColors = {
                                        safe: { bg: 'rgba(6,214,160,0.08)', border: 'rgba(6,214,160,0.2)', color: 'var(--success)' },
                                        warning: { bg: 'rgba(255,190,11,0.08)', border: 'rgba(255,190,11,0.2)', color: 'var(--warning)' },
                                        danger: { bg: 'rgba(255,94,125,0.08)', border: 'rgba(255,94,125,0.2)', color: 'var(--danger)' },
                                    };
                                    const sc = statusColors[status];
                                    return (
                                        <div key={cat} style={{
                                            padding: '1rem',
                                            background: sc.bg,
                                            border: `1px solid ${sc.border}`,
                                            borderRadius: 'var(--radius-md)',
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    {meta.icon} {cat}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px',
                                                    borderRadius: '12px', background: sc.bg, border: `1px solid ${sc.border}`,
                                                    color: sc.color,
                                                }}>
                                                    {status === 'safe' ? '✅ Safe' : status === 'warning' ? '⚠️ Near Limit' : '🚨 Exceeded'}
                                                </span>
                                            </div>
                                            <div className="progress-bar" style={{ marginBottom: 8 }}>
                                                <div className={`progress-fill ${status}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>
                                                    ₹{spent.toLocaleString('en-IN')} <span style={{ color: 'var(--text-muted)' }}>/ ₹{budget.toLocaleString('en-IN')}</span>
                                                </span>
                                                <span style={{ color: sc.color, fontWeight: 600 }}>
                                                    {pct.toFixed(0)}%
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: remaining >= 0 ? 'var(--success)' : 'var(--danger)', marginTop: 4 }}>
                                                {remaining >= 0 ? `₹${remaining.toLocaleString('en-IN')} remaining` : `₹${Math.abs(remaining).toLocaleString('en-IN')} over budget`}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* No budgets set */}
                    {Object.keys(budgets).length === 0 && alerts.length === 0 && (
                        <div className="card">
                            <div className="empty-state">
                                <div className="empty-icon">🎯</div>
                                <div className="empty-title">No budgets configured</div>
                                <div className="empty-desc">
                                    Set monthly budgets for each category to receive smart alerts
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
