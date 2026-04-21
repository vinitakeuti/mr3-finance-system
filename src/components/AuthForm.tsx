'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '../contexts/AuthContext';

export function AuthForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        await signUp(name, email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login');
    setError('');
  };

  const inp = "w-full h-10 px-3 text-sm bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors";

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <div className="relative h-8 w-36">
            <Image src="/assets/images/logo.png" alt="MR3 Digital" fill className="object-contain" sizes="144px" priority />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-[13px] font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Nome</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className={inp}
                placeholder="Seu nome"
              />
            </div>
          )}

          <div>
            <label className="block text-[13px] font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className={inp}
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className={inp}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-[13px] text-negative">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-40"
          >
            {loading ? (mode === 'register' ? 'Criando...' : 'Entrando...') : (mode === 'register' ? 'Criar conta' : 'Entrar')}
          </button>
        </form>

        <button onClick={toggleMode} className="w-full text-center text-[13px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 mt-4 transition-colors">
          {mode === 'login' ? 'Não tem conta? Criar conta' : 'Já tem conta? Entrar'}
        </button>

        <p className="text-center text-[11px] text-neutral-400 mt-8">Controle Financeiro &middot; MR3 Digital</p>
      </div>
    </div>
  );
}
