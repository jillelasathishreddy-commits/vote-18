import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('vote18_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('vote18_token') || null;
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState('login'); // 'login' | 'register'
  const [authInitialRole, setAuthInitialRole] = useState('user'); // 'user' | 'admin'

  const openAuthModal = (mode = 'login', role = 'user') => {
    setAuthInitialMode(mode);
    setAuthInitialRole(role);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('vote18_user', JSON.stringify(userData));
    localStorage.setItem('vote18_token', userToken);
    closeAuthModal();
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('vote18_user');
    localStorage.removeItem('vote18_token');
  };

  // Quick switch role utility for seamless evaluation
  const quickSwitchRole = async (targetRole) => {
    try {
      const email = targetRole === 'admin' ? 'admin@vote18.in' : 'user@vote18.in';
      const password = targetRole === 'admin' ? 'admin123' : 'user123';

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, expectedRole: targetRole }),
      });
      const data = await res.json();
      if (data.success) {
        login(data.user, data.token);
        return { success: true, user: data.user };
      }
    } catch (err) {
      console.error('Quick switch error:', err);
    }
    return { success: false };
  };

  // Check current auth status on mount
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setUser(data.user);
            localStorage.setItem('vote18_user', JSON.stringify(data.user));
          } else {
            logout();
          }
        })
        .catch(() => {});
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        quickSwitchRole,
        authModalOpen,
        authInitialMode,
        authInitialRole,
        openAuthModal,
        closeAuthModal,
        isAdmin: user?.role === 'admin',
        isCitizen: user?.role === 'user',
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
