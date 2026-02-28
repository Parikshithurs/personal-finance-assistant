// ExpenseList.jsx - Sortable, filterable expense table
import React, { useState, useEffect } from 'react';
import { getExpenses } from '../api';

const CATEGORY_ICONS = {
    Food: '🍔', Transport: '🚗', Shopping: '🛍️',
    Bills: '📄', Entertainment: '🎭', Other: '📦',
};

export default function ExpenseList({ refreshKey }) {
    const [expenses, setExpenses] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [sort, setSort] = useState({ key: 'date', dir: 'desc' });

    const CATEGORIES = ['All', 'Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other'];

    useEffect(() => {
        const fetchExpenses = async () => {
            setLoading(true);
            try {
                const res = await getExpenses();
                setExpenses(res.data.expenses || []);
            } catch {
                setExpenses([]);
            } finally {
                setLoading(false);
            }
        };
        fetchExpenses();
    }, [refreshKey]);

    useEffect(() => {
        let data = filter === 'All' ? expenses : expenses.filter(e => e.category === filter);
        data = [...data].sort((a, b) => {
            let av = a[sort.key], bv = b[sort.key];
            if (sort.key === 'amount') { av = parseFloat(av); bv = parseFloat(bv); }
            if (av < bv) return sort.dir === 'asc' ? -1 : 1;
            if (av > bv) return sort.dir === 'asc' ? 1 : -1;
            return 0;
        });
        setFiltered(data);
    }, [expenses, filter, sort]);

    const toggleSort = (key) => {
        setSort(s => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));
    };

    const SortIcon = ({ col }) => {
        if (sort.key !== col) return <span style={{ opacity: 0.3 }}>↕</span>;
        return <span style={{ color: 'var(--primary-light)' }}>{sort.dir === 'asc' ? '↑' : '↓'}</span>;
    };

    const totalFiltered = filtered.reduce((s, e) => s + parseFloat(e.amount || 0), 0);

    return (
        <div className="card fade-in">
            <div className="card-header">
                <h2 className="card-title"><span className="icon">💳</span> Expense History</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {filtered.length} record{filtered.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1rem' }}>
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        id={`filter-${cat.toLowerCase()}`}
                        onClick={() => setFilter(cat)}
                        style={{
                            padding: '4px 12px',
                            border: `1px solid ${filter === cat ? 'var(--primary)' : 'var(--border)'}`,
                            borderRadius: '20px',
                            background: filter === cat ? 'rgba(108,99,255,0.15)' : 'transparent',
                            color: filter === cat ? 'var(--primary-light)' : 'var(--text-muted)',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'var(--transition)',
                        }}
                    >
                        {cat === 'All' ? '🌐' : CATEGORY_ICONS[cat]} {cat}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    <span className="spinner" style={{ borderColor: 'rgba(108,99,255,0.3)', borderTopColor: 'var(--primary)' }} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <div className="empty-title">No expenses found</div>
                    <div className="empty-desc">
                        {filter !== 'All' ? `No ${filter} expenses logged yet` : 'Add your first expense!'}
                    </div>
                </div>
            ) : (
                <>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('description')}>
                                        Description <SortIcon col="description" />
                                    </th>
                                    <th>Category</th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('amount')}>
                                        Amount <SortIcon col="amount" />
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('date')}>
                                        Date <SortIcon col="date" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((exp) => {
                                    const catKey = exp.category?.toLowerCase();
                                    return (
                                        <tr key={exp.id} className="slide-in">
                                            <td style={{ fontWeight: 500, maxWidth: 200, wordBreak: 'break-word' }}>
                                                {exp.description}
                                            </td>
                                            <td>
                                                <span className={`badge badge-${catKey}`}>
                                                    {CATEGORY_ICONS[exp.category] || '📦'} {exp.category}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 700, color: 'var(--accent)' }}>
                                                ₹{Number(exp.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                                                {new Date(exp.date).toLocaleDateString('en-IN', {
                                                    day: '2-digit', month: 'short', year: 'numeric',
                                                })}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Total */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        paddingTop: '12px',
                        borderTop: '1px solid var(--border)',
                        marginTop: '8px',
                    }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Total:{' '}
                            <strong style={{ color: 'var(--accent)', fontSize: '1rem' }}>
                                ₹{totalFiltered.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </strong>
                        </span>
                    </div>
                </>
            )}
        </div>
    );
}
