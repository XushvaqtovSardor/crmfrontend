import { createContext, useContext, useEffect, useState } from 'react';
import api from './api.js';
import { normalizeRole } from './utils/roles.js';
const AuthContext = createContext(null);
const USER_KEY = 'erp_user';
const TOKEN_KEY = 'erp_access_token';
function readStoredJson(key) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    }
    catch {
        localStorage.removeItem(key);
        return null;
    }
}
function normalizeStoredUser(user) {
    if (!user || typeof user !== 'object') {
        return null;
    }
    return {
        ...user,
        role: normalizeRole(user.role),
    };
}
export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => normalizeStoredUser(readStoredJson(USER_KEY)));
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
    const updateStoredUser = (nextUser) => {
        const normalizedUser = normalizeStoredUser(nextUser);
        if (!normalizedUser) {
            localStorage.removeItem(USER_KEY);
            setUser(null);
            return;
        }
        localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
        setUser(normalizedUser);
    };
    const login = ({ user: userData, accessToken }) => {
        updateStoredUser(userData);
        localStorage.setItem(TOKEN_KEY, accessToken);
        setToken(accessToken);
    };
    const updateProfile = (nextUser) => {
        updateStoredUser(nextUser);
    };
    const logout = () => {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setToken(null);
    };
    useEffect(() => {
        if (!token || !user) {
            return undefined;
        }
        let active = true;
        const syncSession = async () => {
            try {
                const response = await api.get('/auth/me');
                const resolvedUser = response?.data?.data?.user ||
                    response?.data?.user ||
                    null;
                if (active && resolvedUser) {
                    updateStoredUser(resolvedUser);
                }
            }
            catch {
                if (active) {
                    logout();
                }
            }
        };
        syncSession();
        return () => {
            active = false;
        };
    }, []);
    return (<AuthContext.Provider value={{ user, token, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>);
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error('useAuth must be inside AuthProvider');
    return ctx;
}
