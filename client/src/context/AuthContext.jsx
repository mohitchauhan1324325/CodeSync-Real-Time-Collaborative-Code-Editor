import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('codesync_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('codesync_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const storedToken = localStorage.getItem('codesync_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('codesync_user', JSON.stringify(res.data.user));
          }
        } catch (error) {
          console.error('[AuthContext] Session validation failed:', error.message);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token: authToken, user: userData } = res.data;
      setToken(authToken);
      setUser(userData);
      localStorage.setItem('codesync_token', authToken);
      localStorage.setItem('codesync_user', JSON.stringify(userData));
      return userData;
    }
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    if (res.data.success) {
      const { token: authToken, user: userData } = res.data;
      setToken(authToken);
      setUser(userData);
      localStorage.setItem('codesync_token', authToken);
      localStorage.setItem('codesync_user', JSON.stringify(userData));
      return userData;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('codesync_token');
    localStorage.removeItem('codesync_user');
  };

  const updateProfile = async (profileData) => {
    const res = await api.put('/auth/profile', profileData);
    if (res.data.success) {
      setUser(res.data.user);
      localStorage.setItem('codesync_user', JSON.stringify(res.data.user));
      return res.data.user;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
