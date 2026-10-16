import React, { createContext, useContext, useEffect, useState } from 'react';
import { clearUserSessionData, financeService } from '../services/financeService';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string, rememberMe?: boolean) => Promise<boolean>;
  signup: (
    name: string,
    email: string,
    password?: string,
    rememberMe?: boolean,
    phone?: string
  ) => Promise<boolean>;
  logout: () => void;
  updateUser: (profile: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Check if valid token exists
    const token = localStorage.getItem('finora_token') || sessionStorage.getItem('finora_token');
    return Boolean(token);
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('finora_token') || sessionStorage.getItem('finora_token');
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }
      try {
        const u = await financeService.getUserProfile();
        setUser(u);
        setIsAuthenticated(true);
      } catch {
        // Token expired or invalid
        setIsAuthenticated(false);
        setUser(null);
        clearUserSessionData();
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (email: string, password?: string, rememberMe: boolean = true) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in. Please verify your credentials.');
      }

      setUser(data.user);
      setIsAuthenticated(true);
      if (rememberMe) {
        localStorage.setItem('finora_token', data.token);
        localStorage.setItem('finora_user_session', 'true');
      } else {
        sessionStorage.setItem('finora_token', data.token);
        sessionStorage.setItem('finora_user_session', 'true');
      }
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    name: string,
    email: string,
    password?: string,
    rememberMe: boolean = true,
    phone?: string
  ) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone?.trim() || '',
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed. Please try again.');
      }

      setUser(data.user);
      setIsAuthenticated(true);
      if (rememberMe) {
        localStorage.setItem('finora_token', data.token);
        localStorage.setItem('finora_user_session', 'true');
      } else {
        sessionStorage.setItem('finora_token', data.token);
        sessionStorage.setItem('finora_user_session', 'true');
      }
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('finora_token') || sessionStorage.getItem('finora_token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => {});
      }
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      clearUserSessionData();
    }
  };

  const updateUser = async (profile: Partial<UserProfile>) => {
    const updated = await financeService.updateUserProfile(profile);
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        signup,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
