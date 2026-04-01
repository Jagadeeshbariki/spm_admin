import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchSheet } from './api';

type Role = 'Admin' | 'office admin' | 'TL' | 'CC';

export interface User {
  user_name: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = () => {
      const storedUser = localStorage.getItem('user');
      const loginTime = localStorage.getItem('loginTime');

      if (storedUser && loginTime) {
        const currentTime = new Date().getTime();
        const timeElapsed = currentTime - parseInt(loginTime);

        if (timeElapsed >= SESSION_TIMEOUT) {
          // Session expired
          setUser(null);
          localStorage.removeItem('user');
          localStorage.removeItem('loginTime');
        } else if (!user) {
          setUser(JSON.parse(storedUser));
        }
      } else if (user) {
        setUser(null);
      }
      setLoading(false);
    };

    checkSession();
    const interval = setInterval(checkSession, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user]);

  const login = async (username: string, password: string) => {
    try {
      const users = await fetchSheet('Users');
      const foundUser = users.find(
        (u: any) => u.user_name === username && u.Password === password
      );
      if (foundUser) {
        const loggedInUser = { user_name: foundUser.user_name, role: foundUser.role as Role };
        const currentTime = new Date().getTime();
        
        setUser(loggedInUser);
        localStorage.setItem('user', JSON.stringify(loggedInUser));
        localStorage.setItem('loginTime', currentTime.toString());
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
