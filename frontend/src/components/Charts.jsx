// Charts.jsx - Beautiful Recharts-powered analytics page
import React, { useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Area, AreaChart,
} from 'recharts';
import { getSummary, getExpenses } from '../api';

const COLORS = {
    Food: '#ff6b6b',
    Transport: '#4cc9f0',
    Shopping: '#f72585',
    Bills: '#ffbe0b',
    Entertainment: '#b06efb',
    Other: '#06d6a0',
};

const CAT_ICONS = {
    Food: '🍔', Transport: '🚗', Shopping: '🛍️',
    Bills: '📄', Entertainment: '🎭', Other: '📦',
};

// Custom Tooltip for Pie Chart
const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
        const { name, value, payload: p } = payload[0];
        const total = p.total;
        const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
        return (
            <div style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: '0.85rem',
            }}>
                <div style={{ fontWeight: 700, color: COLORS[name] || '#fff', marginBottom: 4 }}>
                    {CAT_ICONS[name]} {name}
                </div>
                <div>₹{Number(value).toLocaleString('en-IN')}</div>
                <div style={{ color: 'var(--text-muted)' }}>{pct}% of total</div>
            </div>
        );
    }
    return null;
};

// Custom Tooltip for Bar
const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
        return (
            <div style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: '0.85rem',
            }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{label}</div>
                <div style={{ color: 'var(--accent)' }}>₹{Number(payload[0].value).toLocaleString('en-IN')}</div>
            </div>
        );
    }
    return null;
};

export default function Charts({ refreshKey }) {
    const [summary, setSummary] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [s, e] = await Promise.all([getSummary(), getExpenses()]);
                setSummary(s.data);
                setExpenses(e.data.expenses || []);
            } catch {
                setSummary(null);
                setExpenses([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [refreshKey]);

    // Build Pie data
    const pieData = Object.entries(summary?.by_category || {}).map(([name, value]) => ({
        name, value, total: summary.total_spent,
    }));

    // Build Bar data (sorted by amount)
    const barData = Object.entries(summary?.by_category || {})
        .map(([name, value]) => ({ name: `${CAT_ICONS[name]} ${name}`, value, color: COLORS[name] }))
        .sort((a, b) => b.value - a.value);

    // Build daily trend from expenses
    const dailyMap = {};
    expenses.forEach(exp => {
        const d = exp.date?.split('T')[0] || exp.date;
        dailyMap[d] = (dailyMap[d] || 0) + parseFloat(exp.amount || 0);
    });
    const trendData = Object.entries(dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-14) // last 14 days
        .map(([date, amount]) => ({
            date: new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
            amount,
        }));

    // Custom legend for pie
    const renderPieLegend = () => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', justifyContent: 'center', marginTop: 8 }}>
            {pieData.map(({ name, value }) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[name], display: 'inline-block' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>₹{Number(value).toLocaleString('en-IN')}</span>
                </div>
            ))}
        </div>
    );

    if (loading) {
        return (
            <div className="fade-in">
                <div className="page-header">
                    <h1 className="page-title">📈 Analytics</h1>
                </div>
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <span className="spinner" style={{ width: 32, height: 32, borderColor: 'rgba(108,99,255,0.3)', borderTopColor: 'var(--primary)' }} />
                    <p style={{ marginTop: 16 }}>Loading analytics...</p>
                </div>
            </div>
        );
    }

    const hasData = pieData.length > 0;

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">📈 Spending Analytics</h1>
                <p className="page-subtitle">Visual insights into your expense patterns</p>
            </div>

            {!hasData ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-icon">📊</div>
                        <div className="empty-title">No data to display</div>
                        <div className="empty-desc">Add some expenses first to see charts and analytics</div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Row 1: Pie + Bar */}
                    <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                        {/* Pie Chart */}
                        <div className="card">
                            <div className="card-header">
                                <h2 className="card-title"><span className="icon">🥧</span> Spending by Category</h2>
                            </div>
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={110}
                                        paddingAngle={3}
                                        dataKey="value"
                                        animationBegin={0}
                                        animationDuration={800}
                                    >
                                        {pieData.map((entry) => (
                                            <Cell
                                                key={entry.name}
                                                fill={COLORS[entry.name] || '#888'}
                                                stroke="transparent"
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomPieTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            {renderPieLegend()}
                        </div>

                        {/* Bar Chart */}
                        <div className="card">
                            <div className="card-header">
                                <h2 className="card-title"><span className="icon">📊</span> Category Comparison</h2>
                            </div>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                                        angle={-35}
                                        textAnchor="end"
                                        interval={0}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                                    />
                                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(108,99,255,0.07)' }} />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={50}>
                                        {barData.map((entry) => (
                                            <Cell key={entry.name} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Row 2: Trend Line */}
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title"><span className="icon">📉</span> Daily Spending Trend (Last 14 Days)</h2>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Total: ₹{(summary?.total_spent || 0).toLocaleString('en-IN')}
                            </span>
                        </div>
                        {trendData.length < 2 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                Add expenses on multiple days to see trend
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={240}>
                                <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                                    <YAxis
                                        tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'var(--bg-elevated)',
                                            border: '1px solid var(--border)',
                                            borderRadius: 10,
                                            fontSize: '0.85rem',
                                        }}
                                        labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                                        formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'Spent']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="amount"
                                        stroke="var(--primary)"
                                        strokeWidth={2.5}
                                        fill="url(#areaGrad)"
                                        dot={{ fill: 'var(--primary)', r: 4, strokeWidth: 0 }}
                                        activeDot={{ r: 6, fill: 'var(--primary-light)' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
