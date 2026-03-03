// AuthContext.js - Global authentication state
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);  // true while validating stored token

    // ── Validate stored token on mount ──────────────────────────
    useEffect(() => {
        const token = localStorage.getItem('fa_token');
        if (token) {
            getMe()
                .then((res) => setUser(res.data))
                .catch(() => {
                    localStorage.removeItem('fa_token');
                    localStorage.removeItem('fa_user');
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    // ── Listen for 401 global event from api.js interceptor ─────
    useEffect(() => {
        const handle = () => setUser(null);
        window.addEventListener('fa_unauthorized', handle);
        return () => window.removeEventListener('fa_unauthorized', handle);
    }, []);

    const login = useCallback((token, userData) => {
        localStorage.setItem('fa_token', token);
        localStorage.setItem('fa_user', JSON.stringify(userData));
        setUser(userData);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('fa_token');
        localStorage.removeItem('fa_user');
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
