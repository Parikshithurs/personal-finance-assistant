// ExpenseForm.jsx - Add expense with ML-powered category prediction
import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { predictCategory, addExpense } from '../api';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other'];

const CATEGORY_ICONS = {
    Food: '🍔', Transport: '🚗', Shopping: '🛍️',
    Bills: '📄', Entertainment: '🎭', Other: '📦',
};

export default function ExpenseForm({ onExpenseAdded }) {
    const [form, setForm] = useState({
        description: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
    });
    const [predictedCategory, setPredictedCategory] = useState(null);
    const [predicting, setPredicting] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [predictTimer, setPredictTimer] = useState(null);

    // Auto-predict after user stops typing (debounced)
    const handleDescriptionChange = useCallback((e) => {
        const val = e.target.value;
        setForm(f => ({ ...f, description: val }));
        setPredictedCategory(null);

        if (predictTimer) clearTimeout(predictTimer);
        if (val.trim().length < 3) return;

        const timer = setTimeout(async () => {
            setPredicting(true);
            try {
                const res = await predictCategory(val);
                const cat = res.data.category;
                setPredictedCategory(cat);
                setForm(f => ({ ...f, category: cat }));
            } catch {
                // Backend offline – skip prediction
            } finally {
                setPredicting(false);
            }
        }, 700);
        setPredictTimer(timer);
    }, [predictTimer]);

    const handleChange = (e) => {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.description || !form.amount) {
            toast.error('Please fill in description and amount');
            return;
        }
        if (parseFloat(form.amount) <= 0) {
            toast.error('Amount must be greater than 0');
            return;
        }

        setSubmitting(true);
        try {
            await addExpense({
                description: form.description,
                amount: parseFloat(form.amount),
                category: form.category || predictedCategory || 'Other',
                date: form.date,
            });
            toast.success('Expense added successfully! 🎉');
            setForm({
                description: '',
                amount: '',
                category: '',
                date: new Date().toISOString().split('T')[0],
            });
            setPredictedCategory(null);
            onExpenseAdded?.();
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to add expense. Is the backend running?');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="card fade-in">
            <div className="card-header">
                <h2 className="card-title"><span className="icon">➕</span> Add New Expense</h2>
                <div style={{
                    padding: '4px 10px',
                    background: 'rgba(108, 99, 255, 0.1)',
                    border: '1px solid rgba(108, 99, 255, 0.25)',
                    borderRadius: '20px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: 'var(--primary-light)',
                    letterSpacing: '0.04em',
                }}>
                    🤖 AI-Powered
                </div>
            </div>

            <form onSubmit={handleSubmit} id="expense-form">
                {/* Description */}
                <div className="form-group">
                    <label className="form-label" htmlFor="exp-description">Expense Description</label>
                    <input
                        id="exp-description"
                        name="description"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Lunch at McDonald's, Uber ride, Netflix..."
                        value={form.description}
                        onChange={handleDescriptionChange}
                        autoComplete="off"
                    />

                    {/* AI Prediction Tag */}
                    {predicting && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                            <span className="spinner" style={{ borderColor: 'rgba(108,99,255,0.3)', borderTopColor: 'var(--primary)' }} />
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>AI is predicting category...</span>
                        </div>
                    )}
                    {predictedCategory && !predicting && (
                        <div style={{ marginTop: 6 }}>
                            <span className="predict-tag">
                                🤖 Predicted: {CATEGORY_ICONS[predictedCategory]} {predictedCategory}
                            </span>
                        </div>
                    )}
                </div>

                {/* Amount */}
                <div className="form-group">
                    <label className="form-label" htmlFor="exp-amount">Amount (₹)</label>
                    <div style={{ position: 'relative' }}>
                        <span style={{
                            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                            color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.95rem',
                        }}>₹</span>
                        <input
                            id="exp-amount"
                            name="amount"
                            type="number"
                            className="form-input"
                            style={{ paddingLeft: '28px' }}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            value={form.amount}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Category (manual override) */}
                <div className="form-group">
                    <label className="form-label" htmlFor="exp-category">
                        Category
                        <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6 }}>
                            (auto-filled by AI)
                        </span>
                    </label>
                    <select
                        id="exp-category"
                        name="category"
                        className="form-select"
                        value={form.category}
                        onChange={handleChange}
                    >
                        <option value="">— Select or let AI decide —</option>
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>
                                {CATEGORY_ICONS[cat]} {cat}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Date */}
                <div className="form-group">
                    <label className="form-label" htmlFor="exp-date">Date</label>
                    <input
                        id="exp-date"
                        name="date"
                        type="date"
                        className="form-input"
                        value={form.date}
                        onChange={handleChange}
                        style={{ colorScheme: 'dark' }}
                    />
                </div>

                <div className="divider" />

                {/* Submit */}
                <button
                    type="submit"
                    className="btn btn-primary btn-full"
                    id="add-expense-btn"
                    disabled={submitting}
                >
                    {submitting ? (
                        <><span className="spinner" /> Adding...</>
                    ) : (
                        <>➕ Add Expense</>
                    )}
                </button>

                {/* Info note */}
                <p style={{
                    marginTop: 10,
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    lineHeight: 1.5,
                }}>
                    💡 Type a description and AI will auto-categorize it using ML
                </p>
            </form>
        </div>
    );
}
