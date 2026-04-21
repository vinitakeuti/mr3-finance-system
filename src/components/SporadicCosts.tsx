'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { SectionHeader } from './SectionHeader';

type SporadicCost = { id: string; name: string; description?: string; amount: number; date: string; category: string };

export function SporadicCosts() {
  const [costs, setCosts] = useState<SporadicCost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [formData, setFormData] = useState({ name: '', description: '', amount: '', date: '', category: 'geral' });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/sporadic-costs?month=${encodeURIComponent(selectedMonth)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data)) { setCosts([]); return; }
        setCosts(data.map((i: any) => ({ id: String(i.id), name: String(i.name), description: i.description ?? '', amount: Number(i.amount ?? 0), date: (i.date as string)?.slice(0, 10), category: String(i.category ?? 'geral') })));
      } catch (e) { console.error('Erro ao carregar custos esporádicos', e); }
    })();
  }, [selectedMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: formData.name, description: formData.description || null, amount: parseFloat(formData.amount), date: formData.date, category: formData.category };
    try {
      if (editingId) {
        const res = await fetch(`/api/sporadic-costs/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.error || 'Erro ao atualizar'); }
        const u = await res.json();
        setCosts(prev => prev.map(c => c.id === editingId ? { id: String(u.id), name: String(u.name), description: u.description ?? '', amount: Number(u.amount ?? 0), date: (u.date as string)?.slice(0, 10), category: String(u.category ?? 'geral') } : c));
      } else {
        const res = await fetch('/api/sporadic-costs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.error || 'Erro ao criar'); }
        const c = await res.json();
        setCosts(prev => [...prev, { id: String(c.id), name: String(c.name), description: c.description ?? '', amount: Number(c.amount ?? 0), date: (c.date as string)?.slice(0, 10), category: String(c.category ?? 'geral') }]);
      }
      resetForm(); alert('Custo esporádico salvo com sucesso!');
    } catch (err: any) { console.error(err); alert(err.message || 'Erro ao salvar.'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este custo?')) return;
    try {
      const res = await fetch(`/api/sporadic-costs/${id}`, { method: 'DELETE' });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.error || 'Erro ao excluir'); }
      setCosts(prev => prev.filter(c => c.id !== id));
    } catch (err: any) { console.error(err); alert(err.message || 'Erro ao excluir.'); }
  };

  const handleEdit = (cost: SporadicCost) => {
    setEditingId(cost.id); setFormData({ name: cost.name, description: cost.description || '', amount: cost.amount.toString(), date: cost.date, category: cost.category }); setShowForm(true);
  };

  const resetForm = () => { setFormData({ name: '', description: '', amount: '', date: '', category: 'geral' }); setEditingId(null); setShowForm(false); };
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
  const totalCosts = costs.reduce((s, c) => s + Number(c.amount), 0);

  const inp = "w-full h-10 px-3 text-sm bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors";

  return (
    <div>
      <SectionHeader
        title="Custos Esporádicos"
        rightSlot={
          <div className="flex items-center gap-2">
            <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="h-9 px-3 text-sm bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors" />
            <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-1.5 h-9 px-3 text-[13px] font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </div>
        }
      />

      {showForm && (
        <div className="mb-8 border border-neutral-200 dark:border-neutral-800 rounded-lg p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-medium text-neutral-900 dark:text-white">{editingId ? 'Editar custo' : 'Novo custo esporádico'}</h3>
            <button onClick={resetForm} className="text-neutral-400 hover:text-neutral-600 transition-colors"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Nome</label><input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className={inp} placeholder="Ex: API de Teste" /></div>
              <div><label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Categoria</label><input type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className={inp} placeholder="Ex: teste, api" /></div>
              <div><label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Valor (R$)</label><input type="number" step="0.01" min="0" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} required className={inp} placeholder="0,00" /></div>
              <div><label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Data</label><input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required className={inp} /></div>
            </div>
            <div><label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Descrição</label><textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} className={`${inp} h-auto py-2`} placeholder="Opcional" /></div>
            <div className="flex gap-2">
              <button type="submit" className="h-9 px-4 text-[13px] font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">{editingId ? 'Atualizar' : 'Salvar'}</button>
              <button type="button" onClick={resetForm} className="h-9 px-4 text-[13px] text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {costs.length > 0 && (
        <div className="flex items-center justify-between mb-6 py-3 border-y border-neutral-200 dark:border-neutral-800">
          <span className="text-[11px] uppercase tracking-wider text-neutral-400">Total do mês</span>
          <span className="text-base font-semibold font-mono tabular-nums text-neutral-900 dark:text-white">{fmt(totalCosts)}</span>
        </div>
      )}

      <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-800">
              <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-neutral-400 dark:text-neutral-500">Data</th>
              <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-neutral-400 dark:text-neutral-500">Nome</th>
              <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-neutral-400 dark:text-neutral-500 hidden sm:table-cell">Categoria</th>
              <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-neutral-400 dark:text-neutral-500">Valor</th>
              <th className="w-20 px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {costs.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-[13px] text-neutral-400">Nenhum custo esporádico neste mês</td></tr>
            ) : costs.map(cost => (
              <tr key={cost.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 group">
                <td className="px-4 py-3 text-[13px] text-neutral-500">{fmtDate(cost.date)}</td>
                <td className="px-4 py-3">
                  <p className="text-[13px] text-neutral-900 dark:text-white">{cost.name}</p>
                  {cost.description && <p className="text-[11px] text-neutral-400 mt-0.5">{cost.description}</p>}
                </td>
                <td className="px-4 py-3 text-[13px] text-neutral-500 hidden sm:table-cell">{cost.category}</td>
                <td className="px-4 py-3 text-right text-[13px] font-mono tabular-nums text-neutral-900 dark:text-white">{fmt(Number(cost.amount))}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(cost)} className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(cost.id)} className="p-1.5 text-neutral-400 hover:text-negative transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
