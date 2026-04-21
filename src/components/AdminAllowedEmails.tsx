'use client';

import { useEffect, useState } from 'react';
import { SectionHeader } from './SectionHeader';
import { Plus, Trash2 } from 'lucide-react';

type Role = 'MASTER' | 'CONTADOR' | 'CONSULTOR' | 'DESIGNER';
interface AllowedEmail { id: string; email: string; role: Role; used: boolean; createdAt: string; usedAt: string | null }
const ROLES: Role[] = ['MASTER', 'CONTADOR', 'CONSULTOR', 'DESIGNER'];

export function AdminAllowedEmails() {
  const [items, setItems] = useState<AllowedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('CONSULTOR');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/allowed-emails');
        if (!res.ok) throw new Error('Erro ao carregar');
        setItems(await res.json() as AllowedEmail[]);
      } catch (err) { setError(err instanceof Error ? err.message : 'Erro'); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!email) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/allowed-emails', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, role }) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Erro'); }
      const created = await res.json() as AllowedEmail;
      setItems(prev => [created, ...prev]);
      setEmail(''); setRole('CONSULTOR');
    } catch (err) { alert(err instanceof Error ? err.message : 'Erro'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (item: AllowedEmail) => {
    if (!confirm(`Remover autorização para "${item.email}"?`)) return;
    try {
      const res = await fetch(`/api/admin/allowed-emails/${item.id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Erro ao excluir'); }
      setItems(prev => prev.filter(i => i.id !== item.id));
    } catch (err) { alert(err instanceof Error ? err.message : 'Erro'); }
  };

  if (loading) return <p className="text-[13px] text-neutral-400 py-20 text-center">Carregando...</p>;
  if (error) return <p className="text-[13px] text-negative py-8">{error}</p>;

  const inp = "w-full h-10 px-3 text-sm bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors";

  return (
    <div>
      <SectionHeader title="Emails Autorizados" />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-end mb-4">
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inp} placeholder="usuario@empresa.com" />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Papel</label>
          <select value={role} onChange={e => setRole(e.target.value as Role)} className={inp}>{ROLES.map(r => <option key={r} value={r}>{r}</option>)}</select>
        </div>
        <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-1.5 h-10 px-4 text-[13px] font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-40">
          <Plus className="w-4 h-4" /> {submitting ? 'Salvando...' : 'Autorizar'}
        </button>
      </form>
      <p className="text-[11px] text-neutral-400 mb-8">Apenas emails autorizados aqui poderão criar contas no sistema.</p>

      {items.length === 0 ? (
        <p className="text-[13px] text-neutral-400 py-12 text-center">Nenhum email autorizado.</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-neutral-400">Email</th>
                  <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-neutral-400">Papel</th>
                  <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-neutral-400">Status</th>
                  <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-neutral-400">Data</th>
                  <th className="w-12 px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 group">
                    <td className="px-4 py-3 text-[13px] text-neutral-900 dark:text-white">{item.email}</td>
                    <td className="px-4 py-3 text-[13px] text-neutral-500">{item.role}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-medium px-2 py-1 rounded-md ${item.used ? 'text-neutral-400 bg-neutral-100 dark:bg-neutral-800' : 'text-positive bg-positive/10'}`}>
                        {item.used ? 'Utilizado' : 'Disponível'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-neutral-400">{new Date(item.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(item)} className="p-1.5 text-neutral-400 hover:text-negative transition-colors opacity-0 group-hover:opacity-100">
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
            {items.map(item => (
              <div key={item.id} className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-neutral-900 dark:text-white truncate">{item.email}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[11px] text-neutral-500">{item.role}</span>
                      <span className="text-neutral-300 dark:text-neutral-700">·</span>
                      <span className={`text-[11px] font-medium ${item.used ? 'text-neutral-400' : 'text-positive'}`}>
                        {item.used ? 'Utilizado' : 'Disponível'}
                      </span>
                      <span className="text-neutral-300 dark:text-neutral-700">·</span>
                      <span className="text-[11px] text-neutral-400">{new Date(item.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(item)} className="p-1.5 text-neutral-400 hover:text-negative transition-colors flex-shrink-0">
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
