'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getItems } from './db';

interface AuthContextType {
  user: any | null;
  isLoading: boolean;
  login: (username: string) => Promise<boolean>;
  logout: () => void;
  switchUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync cookie helper
  const setCookie = (name: string, value: string, days = 7) => {
    if (typeof window === 'undefined') return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
  };

  const removeCookie = (name: string) => {
    if (typeof window === 'undefined') return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  };

  useEffect(() => {
    const profiles = getItems('profiles');
    const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('city_league_current_user') : null;
    
    // Default to Ahmet (captain) for seed simulation on first clean load
    const activeId = savedUserId || 'player-ahmet';
    const initialUser = profiles.find(p => p.id === activeId);
    
    const finalUser = initialUser || profiles[0] || null;
    setUser(finalUser);
    
    if (finalUser) {
      localStorage.setItem('city_league_current_user', finalUser.id);
      setCookie('city_league_user_id', finalUser.id);
    }
    
    setIsLoading(false);
  }, []);

  const login = async (username: string): Promise<boolean> => {
    const profiles = getItems('profiles');
    const matched = profiles.find(p => p.username === username);
    if (matched) {
      setUser(matched);
      localStorage.setItem('city_league_current_user', matched.id);
      setCookie('city_league_user_id', matched.id);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('city_league_current_user');
    removeCookie('city_league_user_id');
  };

  const switchUser = (userId: string) => {
    const profiles = getItems('profiles');
    const matched = profiles.find(p => p.id === userId);
    if (matched) {
      setUser(matched);
      localStorage.setItem('city_league_current_user', matched.id);
      setCookie('city_league_user_id', matched.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, switchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
