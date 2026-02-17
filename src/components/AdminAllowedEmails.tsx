'use client';

import { useEffect, useState } from 'react';
import { SectionHeader } from './SectionHeader';

type Role = 'MASTER' | 'CONTADOR' | 'CONSULTOR' | 'DESIGNER';

interface AllowedEmail {
  id: string;
  email: string;
  role: Role;
  used: boolean;
  createdAt: string;
  usedAt: string | null;
}

const ROLES: Role[] = ['MASTER', 'CONTADOR', 'CONSULTOR', 'DESIGNER'];

export function AdminAllowedEmails() {
  const [items, setItems] = useState<AllowedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('CONSULTOR');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/allowed-emails');
        if (!res.ok) {
          throw new Error('Erro ao carregar emails permitidos');
        }
        const data = (await res.json()) as AllowedEmail[];
        setItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar emails permitidos');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/allowed-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao adicionar email');
      }
      const created = (await res.json()) as AllowedEmail;
      setItems(prev => [created, ...prev]);
      setEmail('');
      setRole('CONSULTOR');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao adicionar email');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600 dark:text-gray-400">Carregando emails permitidos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-500 bg-red-50 dark:bg-red-900/20 p-4">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Emails Autorizados para Cadastro" />

      <div className="border border-black dark:border-white p-6">
        <h3 className="text-xl font-bold text-black dark:text-white mb-4">
          Adicionar novo email
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-black dark:border-white bg-transparent text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              placeholder="usuario@empresa.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Papel padrão
            </label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as Role)}
              className="w-full px-4 py-2 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            >
              {ROLES.map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-2 bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Salvando...' : 'Autorizar Email'}
            </button>
          </div>
        </form>
        <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
          Apenas emails autorizados aqui poderão criar contas. O papel definido será aplicado
          automaticamente no primeiro cadastro realizado com esse email.
        </p>
      </div>

      <div className="border border-black dark:border-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black dark:border-white">
                <th className="text-left p-4 text-sm font-medium text-black dark:text-white">
                  Email
                </th>
                <th className="text-left p-4 text-sm font-medium text-black dark:text-white">
                  Papel
                </th>
                <th className="text-left p-4 text-sm font-medium text-black dark:text-white">
                  Status
                </th>
                <th className="text-left p-4 text-sm font-medium text-black dark:text-white">
                  Criado em
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-600 dark:text-gray-400">
                    Nenhum email autorizado ainda.
                  </td>
                </tr>
              ) : (
                items.map(item => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <td className="p-4 text-gray-700 dark:text-gray-300">{item.email}</td>
                    <td className="p-4 text-gray-700 dark:text-gray-300">{item.role}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          item.used
                            ? 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                            : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        }`}
                      >
                        {item.used ? 'Já utilizado' : 'Disponível'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-700 dark:text-gray-300">
                      {new Date(item.createdAt).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

