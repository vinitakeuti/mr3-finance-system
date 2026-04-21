'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { SectionHeader } from './SectionHeader';

type Role = 'MASTER' | 'CONTADOR' | 'CONSULTOR' | 'DESIGNER';
interface User { id: string; email: string; name: string; role: Role; isActive: boolean }
const ROLES: Role[] = ['MASTER', 'CONTADOR', 'CONSULTOR', 'DESIGNER'];

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/users');
        if (!res.ok) throw new Error('Erro ao carregar usuários');
        setUsers(await res.json() as User[]);
      } catch (err) { setError(err instanceof Error ? err.message : 'Erro'); }
      finally { setLoading(false); }
    })();
  }, []);

  const updateUser = async (id: string, patch: Partial<Pick<User, 'role' | 'isActive'>>) => {
    try {
      const res = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...patch }) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Erro'); }
      const u = await res.json() as User;
      setUsers(prev => prev.map(x => x.id === u.id ? u : x));
    } catch (err) { alert(err instanceof Error ? err.message : 'Erro'); }
  };

  const deleteUser = async (user: User) => {
    if (!confirm(`Excluir o usuário "${user.name}" (${user.email})? Esta ação não pode ser desfeita.`)) return;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Erro ao excluir'); }
      setUsers(prev => prev.filter(u => u.id !== user.id));
    } catch (err) { alert(err instanceof Error ? err.message : 'Erro'); }
  };

  if (loading) return <p className="text-[13px] text-neutral-400 py-20 text-center">Carregando...</p>;
  if (error) return <p className="text-[13px] text-negative py-8">{error}</p>;

  return (
    <div>
      <SectionHeader title="Usuários" />

      {users.length === 0 ? (
        <p className="text-[13px] text-neutral-400 py-12 text-center">Nenhum usuário cadastrado.</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-neutral-400">Nome</th>
                  <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-neutral-400">Email</th>
                  <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-neutral-400">Papel</th>
                  <th className="text-center px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-neutral-400">Status</th>
                  <th className="w-12 px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 group">
                    <td className="px-4 py-3 text-[13px] text-neutral-900 dark:text-white font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-[13px] text-neutral-500">{user.email}</td>
                    <td className="px-4 py-3">
                      <select value={user.role} onChange={e => updateUser(user.id, { role: e.target.value as Role })} className="h-8 px-2 text-[13px] bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-md text-neutral-900 dark:text-white focus:outline-none">
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => updateUser(user.id, { isActive: !user.isActive })} className={`text-[11px] font-medium px-2 py-1 rounded-md transition-colors ${user.isActive ? 'text-positive bg-positive/10' : 'text-neutral-400 bg-neutral-100 dark:bg-neutral-800'}`}>
                        {user.isActive ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteUser(user)} className="p-1.5 text-neutral-400 hover:text-negative transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {users.map(user => (
              <div key={user.id} className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-neutral-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-neutral-400 truncate mt-0.5">{user.email}</p>
                  </div>
                  <button onClick={() => updateUser(user.id, { isActive: !user.isActive })} className={`text-[11px] font-medium px-2 py-1 rounded-md flex-shrink-0 transition-colors ${user.isActive ? 'text-positive bg-positive/10' : 'text-neutral-400 bg-neutral-100 dark:bg-neutral-800'}`}>
                    {user.isActive ? 'Ativo' : 'Inativo'}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <select value={user.role} onChange={e => updateUser(user.id, { role: e.target.value as Role })} className="h-8 px-2 text-[13px] bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-md text-neutral-900 dark:text-white focus:outline-none">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button onClick={() => deleteUser(user)} className="p-1.5 text-neutral-400 hover:text-negative transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
