// LoginPage.jsx - Premium login & register page
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { loginUser, registerUser } from '../api';
import { useAuth } from '../AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const [tab, setTab] = useState('login');      // 'login' | 'register'
    const [loading, setLoading] = useState(false);

    // Form fields
    const [form, setForm] = useState({
        username: '', email: '', password: '', confirm: '',
    });

    const set = (field) => (e) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }));

    // ── Submit ────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (tab === 'register') {
                if (!form.username.trim()) {
                    toast.error('Username is required'); return;
                }
                if (form.password !== form.confirm) {
                    toast.error('Passwords do not match'); return;
                }
                if (form.password.length < 6) {
                    toast.error('Password must be at least 6 characters'); return;
                }
                const res = await registerUser({
                    username: form.username.trim(),
                    email: form.email.trim(),
                    password: form.password,
                });
                toast.success(res.data.message || 'Account created!');
                login(res.data.token, res.data.user);
            } else {
                const res = await loginUser({
                    email: form.email.trim(),
                    password: form.password,
                });
                toast.success('Welcome back! 👋');
                login(res.data.token, res.data.user);
            }
        } catch (err) {
            const msg = err.response?.data?.error || 'Something went wrong';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.overlay}>
            {/* Animated blobs */}
            <div style={styles.blob1} />
            <div style={styles.blob2} />
            <div style={styles.blob3} />

            <div style={styles.card}>
                {/* Logo */}
                <div style={styles.logoRow}>
                    <div style={styles.logoIcon}>💰</div>
                    <span style={styles.logoText}>Personal Finance Assistant</span>
                </div>

                <p style={styles.tagline}>Your money, your privacy, your control.</p>

                {/* Tab switcher */}
                <div style={styles.tabBar}>
                    <button
                        style={{ ...styles.tabBtn, ...(tab === 'login' ? styles.tabActive : {}) }}
                        onClick={() => setTab('login')}
                        type="button"
                        id="tab-login"
                    >
                        Sign In
                    </button>
                    <button
                        style={{ ...styles.tabBtn, ...(tab === 'register' ? styles.tabActive : {}) }}
                        onClick={() => setTab('register')}
                        type="button"
                        id="tab-register"
                    >
                        Create Account
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={styles.form} autoComplete="off">
                    {tab === 'register' && (
                        <div style={styles.field}>
                            <label style={styles.label}>Username</label>
                            <input
                                id="input-username"
                                style={styles.input}
                                type="text"
                                placeholder="e.g. john_doe"
                                value={form.username}
                                onChange={set('username')}
                                required
                                autoComplete="off"
                            />
                        </div>
                    )}

                    <div style={styles.field}>
                        <label style={styles.label}>Email</label>
                        <input
                            id="input-email"
                            style={styles.input}
                            type="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={set('email')}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Password</label>
                        <input
                            id="input-password"
                            style={styles.input}
                            type="password"
                            placeholder={tab === 'register' ? 'Min. 6 characters' : '••••••••'}
                            value={form.password}
                            onChange={set('password')}
                            required
                            autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
                        />
                    </div>

                    {tab === 'register' && (
                        <div style={styles.field}>
                            <label style={styles.label}>Confirm Password</label>
                            <input
                                id="input-confirm"
                                style={styles.input}
                                type="password"
                                placeholder="••••••••"
                                value={form.confirm}
                                onChange={set('confirm')}
                                required
                                autoComplete="new-password"
                            />
                        </div>
                    )}

                    <button
                        id="btn-submit"
                        type="submit"
                        style={{ ...styles.submitBtn, ...(loading ? styles.submitBtnDisabled : {}) }}
                        disabled={loading}
                    >
                        {loading
                            ? (tab === 'login' ? 'Signing in…' : 'Creating account…')
                            : (tab === 'login' ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                {/* Switch hint */}
                <p style={styles.switchHint}>
                    {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
                    <button
                        style={styles.switchLink}
                        onClick={() => setTab(tab === 'login' ? 'register' : 'login')}
                        type="button"
                    >
                        {tab === 'login' ? 'Register' : 'Sign in'}
                    </button>
                </p>
            </div>
        </div>
    );
}

// ─── Inline styles (matches the app's dark theme) ────────────────
const styles = {
    overlay: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #0a0a0f 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
    },
    blob1: {
        position: 'absolute', width: 500, height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)',
        top: '-100px', left: '-150px',
        animation: 'blob-pulse 8s ease-in-out infinite',
        pointerEvents: 'none',
    },
    blob2: {
        position: 'absolute', width: 400, height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,214,160,0.15) 0%, transparent 70%)',
        bottom: '-80px', right: '-100px',
        animation: 'blob-pulse 10s ease-in-out infinite 2s',
        pointerEvents: 'none',
    },
    blob3: {
        position: 'absolute', width: 300, height: 300,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,102,43,0.12) 0%, transparent 70%)',
        top: '40%', right: '20%',
        animation: 'blob-pulse 12s ease-in-out infinite 4s',
        pointerEvents: 'none',
    },
    card: {
        position: 'relative', zIndex: 1,
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24,
        padding: '40px 44px',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.15)',
    },
    logoRow: {
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6,
        justifyContent: 'center',
    },
    logoIcon: {
        fontSize: 28,
        background: 'linear-gradient(135deg, #7c3aed, #06d6a0)',
        borderRadius: 10,
        width: 44, height: 44,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    logoText: {
        fontSize: '1.1rem', fontWeight: 700,
        background: 'linear-gradient(90deg, #a78bfa, #06d6a0)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
    },
    tagline: {
        textAlign: 'center', color: 'rgba(255,255,255,0.4)',
        fontSize: '0.8rem', marginBottom: 28, marginTop: 2,
    },
    tabBar: {
        display: 'flex', gap: 4, marginBottom: 28,
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 12, padding: 4,
    },
    tabBtn: {
        flex: 1, padding: '9px 0',
        border: 'none', borderRadius: 9, cursor: 'pointer',
        fontSize: '0.875rem', fontWeight: 600,
        background: 'transparent',
        color: 'rgba(255,255,255,0.45)',
        transition: 'all 0.2s',
        fontFamily: 'inherit',
    },
    tabActive: {
        background: 'linear-gradient(135deg, rgba(124,58,237,0.5), rgba(6,214,160,0.3))',
        color: '#fff',
        boxShadow: '0 2px 12px rgba(124,58,237,0.3)',
    },
    form: {
        display: 'flex', flexDirection: 'column', gap: 16,
    },
    field: {
        display: 'flex', flexDirection: 'column', gap: 6,
    },
    label: {
        fontSize: '0.8rem', fontWeight: 600,
        color: 'rgba(255,255,255,0.55)',
        letterSpacing: '0.5px',
    },
    input: {
        padding: '12px 14px',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        color: '#fff',
        fontSize: '0.95rem',
        fontFamily: 'inherit',
        outline: 'none',
        transition: 'border 0.2s',
    },
    submitBtn: {
        marginTop: 8,
        padding: '13px 0',
        background: 'linear-gradient(135deg, #7c3aed 0%, #06d6a0 100%)',
        border: 'none', borderRadius: 12,
        color: '#fff', fontWeight: 700,
        fontSize: '0.95rem', cursor: 'pointer',
        fontFamily: 'inherit',
        boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
        transition: 'opacity 0.2s, transform 0.15s',
    },
    submitBtnDisabled: {
        opacity: 0.6, cursor: 'not-allowed', transform: 'none',
    },
    switchHint: {
        textAlign: 'center', marginTop: 20,
        fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)',
    },
    switchLink: {
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#a78bfa', fontWeight: 600, fontSize: 'inherit',
        fontFamily: 'inherit', textDecoration: 'underline',
        textDecorationColor: 'rgba(167,139,250,0.4)',
    },
};
