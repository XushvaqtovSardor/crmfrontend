import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

// LocalStorage keys shared across the frontend app.
const USER_KEY = 'erp_user';
const TOKEN_KEY = 'erp_access_token';

export function AuthProvider({ children }) {
  // Hydrates user session from storage on first render.
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  // Token is stored separately for request interceptor usage.
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  const login = ({ user: userData, accessToken }) => {
    // Persists auth state and syncs React state.
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    localStorage.setItem(TOKEN_KEY, accessToken);
    setUser(userData);
    setToken(accessToken);
  };

  const logout = () => {
    // Clears auth session from both storage and memory.
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  // Enforces hook usage inside provider tree.
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
