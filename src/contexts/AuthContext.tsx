import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    role: 'admin',
    name: 'Administrator'
  },
  {
    id: '2',
    username: 'user',
    role: 'user',
    name: 'John Doe'
  },
  {
    id: '3',
    username: 'bart',
    role: 'user',
    name: 'Bart'
  },
  {
    id: '4',
    username: 'mae',
    role: 'user',
    name: 'Mae'
  },
  {
    id: '5',
    username: 'angela',
    role: 'user',
    name: 'Angela'
  },
  {
    id: '6',
    username: 'chris',
    role: 'user',
    name: 'Chris'
  },
  {
    id: '7',
    username: 'andre',
    role: 'user',
    name: 'Andre'
  },
  {
    id: '8',
    username: 'akeem',
    role: 'user',
    name: 'Akeem'
  },
  {
    id: '9',
    username: 'guest',
    role: 'user',
    name: 'Guest User'
  }
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (username: string, password: string): boolean => {
    // Simple mock authentication
    const foundUser = mockUsers.find(u => u.username === username);
    if (foundUser && password === 'password') {
      setUser(foundUser);
      localStorage.setItem('user', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};