import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from './api';

interface AuthUser {
  id: string;
  name: string;
  phone: string;
  role: 'CLIENT' | 'PROVIDER' | 'ADMIN';
  avatar?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, refreshToken: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  isProvider: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuth();
  }, []);

  async function loadAuth() {
    try {
      const savedToken = await AsyncStorage.getItem('tokoss_token');
      const savedUser = await AsyncStorage.getItem('tokoss_user');
      if (savedToken && savedUser) {
        setToken(savedToken);
        setAuthToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch {}
    setIsLoading(false);
  }

  async function login(newToken: string, refreshToken: string, newUser: AuthUser) {
    setToken(newToken);
    setAuthToken(newToken);
    setUser(newUser);
    await AsyncStorage.setItem('tokoss_token', newToken);
    await AsyncStorage.setItem('tokoss_refresh', refreshToken);
    await AsyncStorage.setItem('tokoss_user', JSON.stringify(newUser));
  }

  async function logout() {
    setToken(null);
    setAuthToken(null);
    setUser(null);
    await AsyncStorage.multiRemove(['tokoss_token', 'tokoss_refresh', 'tokoss_user']);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, isProvider: user?.role === 'PROVIDER' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
