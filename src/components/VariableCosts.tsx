'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { SectionHeader } from './SectionHeader';

export function VariableCosts() {
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [formData, setFormData] = useState({ ad_accounts_purchase: '', gateway_percentage: '', withdrawal_count: '', p2p_transfers: '' });
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/variable-costs?month=${encodeURIComponent(selectedMonth)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data) { setExistingId(null); setFormData({ ad_accounts_purchase: '', gateway_percentage: '', withdrawal_count: '', p2p_transfers: '' }); return; }
        setExistingId(data.id ?? null);
        setFormData({ ad_accounts_purchase: String(data.ad_accounts_purchase ?? ''), gateway_percentage: String(data.gateway_percentage ?? ''), withdrawal_count: String(data.withdrawal_count ?? ''), p2p_transfers: String(data.p2p_transfers ?? '') });
      } catch (e) { console.error('Erro ao carregar custos variáveis', e); }
    })();
  }, [selectedMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/variable-costs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ month: selectedMonth, ad_accounts_purchase: parseFloat(formData.ad_accounts_purchase) || 0, gateway_percentage: parseFloat(formData.gateway_percentage) || 0, withdrawal_count: parseInt(formData.withdrawal_count) || 0, p2p_transfers: parseFloat(formData.p2p_transfers) || 0 }) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.error || 'Erro ao salvar'); }
      const saved = await res.json();
      setExistingId(saved.id ?? null);
      alert('Custos variáveis salvos com sucesso!');
    } catch (err: any) { console.error(err); alert(err.message || 'Erro ao salvar.'); }
    finally { setLoading(false); }
  };

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const withdrawalTotal = (parseInt(formData.withdrawal_count) || 0) * 10;
  const p2pFees = (parseFloat(formData.p2p_transfers) || 0) * 0.05;
  const total = (parseFloat(formData.ad_accounts_purchase) || 0) + (parseFloat(formData.gateway_percentage) || 0) + withdrawalTotal + p2pFees;

  const inp = "w-full h-10 px-3 text-sm bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors";

  return (
    <div>
      <SectionHeader
        title="Custos Variáveis"
        rightSlot={
          <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="h-9 px-3 text-sm bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors" />
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Compra de contas de anúncio (R$)</label>
            <input type="number" step="0.01" min="0" value={formData.ad_accounts_purchase} onChange={e => setFormData({ ...formData, ad_accounts_purchase: e.target.value })} className={inp} placeholder="0,00" />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Taxa de gateway (R$)</label>
            <input type="number" step="0.01" min="0" value={formData.gateway_percentage} onChange={e => setFormData({ ...formData, gateway_percentage: e.target.value })} className={inp} placeholder="0,00" />
            <p className="text-[11px] text-neutral-400 mt-1">Percentual do gateway sobre o faturamento</p>
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Quantidade de saques</label>
            <input type="number" min="0" value={formData.withdrawal_count} onChange={e => setFormData({ ...formData, withdrawal_count: e.target.value })} className={inp} placeholder="0" />
            <p className="text-[11px] text-neutral-400 mt-1">R$ 10,00/saque &middot; Total: <span className="font-mono text-neutral-600 dark:text-neutral-300">{fmt(withdrawalTotal)}</span></p>
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Transferências P2P (R$)</label>
            <input type="number" step="0.01" min="0" value={formData.p2p_transfers} onChange={e => setFormData({ ...formData, p2p_transfers: e.target.value })} className={inp} placeholder="0,00" />
            <p className="text-[11px] text-neutral-400 mt-1">Taxa 5% &middot; <span className="font-mono text-neutral-600 dark:text-neutral-300">{fmt(p2pFees)}</span></p>
          </div>
        </div>

        <div className="flex items-center justify-between py-4 border-t border-neutral-200 dark:border-neutral-800">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-400 mb-0.5">Total custos variáveis</p>
            <p className="text-lg font-semibold font-mono tabular-nums text-neutral-900 dark:text-white">{fmt(total)}</p>
          </div>
          <button type="submit" disabled={loading} className="inline-flex items-center gap-1.5 h-9 px-4 text-[13px] font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-40">
            <Save className="w-4 h-4" />
            {loading ? 'Salvando...' : existingId ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}
