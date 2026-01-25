 'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '../contexts/AuthContext';

export function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao autenticar';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black transition-colors">
      <div className="w-full max-w-md px-6">
        <div className="border border-black dark:border-white p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 mb-4 relative">
              <Image
                src="/assets/images/logo.png"
                alt="Logo Controle Financeiro"
                fill
                className="object-contain"
                sizes="64px"
                priority
              />
            </div>
            <h1 className="text-3xl font-bold text-center text-black dark:text-white">
              Controle Financeiro
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-center">
            Acesse com as credenciais de teste definidas no arquivo de ambiente (.env).
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-8 text-center">
            Padrão: email <span className="font-mono">demo@sistemamr.com</span> e senha <span className="font-mono">123456</span>, 
            caso você não tenha sobrescrito as variáveis <span className="font-mono">NEXT_PUBLIC_AUTH_TEST_EMAIL</span> e <span className="font-mono">NEXT_PUBLIC_AUTH_TEST_PASSWORD</span>.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-black dark:border-white bg-transparent text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-black dark:border-white bg-transparent text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="border border-red-500 bg-red-50 dark:bg-red-900/20 p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-3 font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
