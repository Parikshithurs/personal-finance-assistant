// BudgetForm.jsx - Set and manage monthly category budgets
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { setBudget, getBudgets, getSummary } from '../api';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other'];

const CATEGORY_META = {
    Food: { icon: '🍔', color: 'var(--cat-food)', desc: 'Groceries, dining, snacks' },
    Transport: { icon: '🚗', color: 'var(--cat-transport)', desc: 'Fuel, cab rides, public transit' },
    Shopping: { icon: '🛍️', color: 'var(--cat-shopping)', desc: 'Clothes, gadgets, online orders' },
    Bills: { icon: '📄', color: 'var(--cat-bills)', desc: 'Utilities, rent, subscriptions' },
    Entertainment: { icon: '🎭', color: '#b06efb', desc: 'Movies, games, events' },
    Other: { icon: '📦', color: 'var(--cat-other)', desc: 'Miscellaneous expenses' },
};

export default function BudgetForm({ onBudgetSet, refreshKey }) {
    const [budgets, setBudgets] = useState({});
    const [inputs, setInputs] = useState({});
    const [saving, setSaving] = useState({});
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [budgetRes, summaryRes] = await Promise.all([getBudgets(), getSummary()]);
                const b = budgetRes.data.budgets || {};
                setBudgets(b);
                // Pre-fill inputs with existing budgets
                const init = {};
                CATEGORIES.forEach(cat => { init[cat] = b[cat] ? String(b[cat]) : ''; });
                setInputs(init);
                setSummary(summaryRes.data || {});
            } catch {
                const init = {};
                CATEGORIES.forEach(cat => { init[cat] = ''; });
                setInputs(init);
            }
        };
        fetchData();
    }, [refreshKey]);

    const handleSaveBudget = async (cat) => {
        const val = parseFloat(inputs[cat]);
        if (!val || val <= 0) {
            toast.error(`Enter a valid amount for ${cat}`);
            return;
        }
        setSaving(s => ({ ...s, [cat]: true }));
        try {
            await setBudget({ category: cat, budget: val });
            setBudgets(b => ({ ...b, [cat]: val }));
            toast.success(`${CATEGORY_META[cat].icon} ${cat} budget set to ₹${val.toLocaleString('en-IN')}`);
            onBudgetSet?.();
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to set budget');
        } finally {
            setSaving(s => ({ ...s, [cat]: false }));
        }
    };

    const getStatus = (cat) => {
        const budget = budgets[cat];
        const spent = summary?.by_category?.[cat] || 0;
        if (!budget) return null;
        const pct = (spent / budget) * 100;
        if (pct >= 100) return 'danger';
        if (pct >= 80) return 'warning';
        return 'safe';
    };

    const statusColors = {
        safe: { color: 'var(--success)', label: '✅ On track' },
        warning: { color: 'var(--warning)', label: '⚠️ Near limit' },
        danger: { color: 'var(--danger)', label: '🚨 Exceeded' },
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">🎯 Budget Management</h1>
                <p className="page-subtitle">Set monthly spending limits for each category</p>
            </div>

            {/* Info Card */}
            <div style={{
                padding: '1rem 1.5rem',
                background: 'rgba(108,99,255,0.07)',
                border: '1px solid rgba(108,99,255,0.2)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
            }}>
                <span style={{ fontSize: '1.3rem' }}>💡</span>
                <span>
                    Set monthly budgets for each spending category. FinanceAI will automatically alert you
                    when you approach or exceed the limit.
                </span>
            </div>

            {/* Budget Cards Grid */}
            <div className="grid-3">
                {CATEGORIES.map(cat => {
                    const meta = CATEGORY_META[cat];
                    const currentBudget = budgets[cat];
                    const spent = summary?.by_category?.[cat] || 0;
                    const pct = currentBudget ? Math.min((spent / currentBudget) * 100, 100) : 0;
                    const status = getStatus(cat);
                    const fillClass = status === 'danger' ? 'danger' : status === 'warning' ? 'warning' : 'safe';

                    return (
                        <div key={cat} className="card" style={{
                            borderColor: status === 'danger'
                                ? 'rgba(255,94,125,0.3)'
                                : status === 'warning'
                                    ? 'rgba(255,190,11,0.3)'
                                    : 'var(--border)',
                        }}>
                            {/* Category Header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 10,
                                        background: `${meta.color}22`,
                                        border: `1px solid ${meta.color}44`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.2rem',
                                    }}>
                                        {meta.icon}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{cat}</div>
                                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{meta.desc}</div>
                                    </div>
                                </div>
                                {status && (
                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: statusColors[status].color }}>
                                        {statusColors[status].label}
                                    </span>
                                )}
                            </div>

                            {/* Current Budget & Spent */}
                            {currentBudget ? (
                                <div style={{ marginBottom: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.8rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>
                                            Spent: <strong style={{ color: 'var(--text-primary)' }}>₹{spent.toLocaleString('en-IN')}</strong>
                                        </span>
                                        <span style={{ color: 'var(--text-muted)' }}>
                                            Limit: <strong style={{ color: meta.color }}>₹{currentBudget.toLocaleString('en-IN')}</strong>
                                        </span>
                                    </div>
                                    <div className="progress-bar">
                                        <div className={`progress-fill ${fillClass}`} style={{ width: `${pct}%` }} />
                                    </div>
                                    <div style={{ textAlign: 'right', fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                        {pct.toFixed(0)}% used
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    marginBottom: 12, padding: '8px 12px',
                                    background: 'var(--bg-elevated)',
                                    borderRadius: 8,
                                    fontSize: '0.78rem',
                                    color: 'var(--text-muted)',
                                    textAlign: 'center',
                                }}>
                                    No budget set yet
                                </div>
                            )}

                            {/* Input + Save */}
                            <div style={{ display: 'flex', gap: 8 }}>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <span style={{
                                        position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                                        color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem',
                                    }}>₹</span>
                                    <input
                                        id={`budget-input-${cat.toLowerCase()}`}
                                        type="number"
                                        className="form-input"
                                        style={{ paddingLeft: 24, fontSize: '0.875rem' }}
                                        placeholder={currentBudget ? currentBudget.toLocaleString('en-IN') : '0'}
                                        value={inputs[cat] || ''}
                                        min="0"
                                        onChange={e => setInputs(i => ({ ...i, [cat]: e.target.value }))}
                                    />
                                </div>
                                <button
                                    id={`budget-save-${cat.toLowerCase()}`}
                                    className="btn btn-primary"
                                    style={{ padding: '10px 14px', flexShrink: 0 }}
                                    onClick={() => handleSaveBudget(cat)}
                                    disabled={saving[cat]}
                                >
                                    {saving[cat] ? <span className="spinner" /> : currentBudget ? '✏️' : '✅'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
