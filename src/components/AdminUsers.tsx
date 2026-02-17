'use client';

import { useEffect, useState } from 'react';
import { SectionHeader } from './SectionHeader';

type Role = 'MASTER' | 'CONTADOR' | 'CONSULTOR' | 'DESIGNER';

interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
}

const ROLES: Role[] = ['MASTER', 'CONTADOR', 'CONSULTOR', 'DESIGNER'];

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/users');
        if (!res.ok) {
          throw new Error('Erro ao carregar usuários');
        }
        const data = (await res.json()) as User[];
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar usuários');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const updateUser = async (id: string, patch: Partial<Pick<User, 'role' | 'isActive'>>) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...patch }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao atualizar usuário');
      }
      const updated = (await res.json()) as User;
      setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar usuário');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600 dark:text-gray-400">Carregando usuários...</p>
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
      <SectionHeader title="Administração de Usuários" />

      <div className="border border-black dark:border-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black dark:border-white">
                <th className="text-left p-4 text-sm font-medium text-black dark:text-white">Nome</th>
                <th className="text-left p-4 text-sm font-medium text-black dark:text-white">Email</th>
                <th className="text-left p-4 text-sm font-medium text-black dark:text-white">Papel</th>
                <th className="text-center p-4 text-sm font-medium text-black dark:text-white">Ativo</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-600 dark:text-gray-400">
                    Nenhum usuário cadastrado ainda.
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <td className="p-4">
                      <p className="font-medium text-black dark:text-white">{user.name}</p>
                    </td>
                    <td className="p-4 text-gray-700 dark:text-gray-300">{user.email}</td>
                    <td className="p-4">
                      <select
                        value={user.role}
                        onChange={e => updateUser(user.id, { role: e.target.value as Role })}
                        className="px-3 py-2 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white text-sm"
                      >
                        {ROLES.map(role => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => updateUser(user.id, { isActive: !user.isActive })}
                        className={`px-3 py-1 text-xs font-medium border transition-colors ${
                          user.isActive
                            ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300 border-gray-400 dark:border-gray-600'
                        }`}
                      >
                        {user.isActive ? 'Ativo' : 'Inativo'}
                      </button>
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

