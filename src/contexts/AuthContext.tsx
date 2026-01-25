 'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

const TEST_USER_EMAIL = process.env.NEXT_PUBLIC_AUTH_TEST_EMAIL || 'demo@sistemamr.com';
const TEST_USER_PASSWORD = process.env.NEXT_PUBLIC_AUTH_TEST_PASSWORD || '123456';
const TEST_USER_NAME = process.env.NEXT_PUBLIC_AUTH_TEST_NAME || 'Usuário Demo';
const STORAGE_KEY = 'sistemaMR3_auth_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthUser;
        setUser(parsed);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    if (email === TEST_USER_EMAIL && password === TEST_USER_PASSWORD) {
      const loggedUser: AuthUser = {
        id: 'test-user',
        email,
        name: TEST_USER_NAME,
      };
      setUser(loggedUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedUser));
      return;
    }

    throw new Error(
      `Credenciais inválidas. Use email "${TEST_USER_EMAIL}" e senha "${TEST_USER_PASSWORD}".`
    );
  };

  const signUp = async (email: string, password: string) => {
    // Ambiente de teste: cadastro de novos usuários desabilitado
    throw new Error(
      'Cadastro de novos usuários está desabilitado neste ambiente de teste. Use o usuário de demonstração.'
    );
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
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
