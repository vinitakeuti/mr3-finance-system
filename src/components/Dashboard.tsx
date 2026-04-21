'use client';

import { useEffect, useMemo, useState } from 'react';
import { SectionHeader } from './SectionHeader';

interface DailyEntry {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  date: string;
  description: string | null;
  categoryRef: { id: string; name: string; color: string } | null;
}

interface CostSummary {
  id: string;
  name: string;
  category: string;
  categoryColor: string;
  total: number;
  due_day: number | null;
  recurrence: string;
}

export function Dashboard() {
  const [dailyEntries, setDailyEntries] = useState<DailyEntry[]>([]);
  const [costsList, setCostsList] = useState<CostSummary[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    const load = async () => {
      const monthQuery = `month=${encodeURIComponent(selectedMonth)}`;
      try {
        const [entriesRes, costsRes] = await Promise.all([
          fetch(`/api/daily-entries?${monthQuery}`),
          fetch(`/api/costs?${monthQuery}`),
        ]);
        const entriesData = entriesRes.ok ? await entriesRes.json() : [];
        const costsData = costsRes.ok ? await costsRes.json() : [];

        if (Array.isArray(entriesData)) {
          setDailyEntries(entriesData.map((e: any) => ({
            id: String(e.id),
            type: e.type as 'INCOME' | 'EXPENSE',
            amount: Number(e.amount ?? 0),
            date: String(e.date),
            description: e.description || null,
            categoryRef: e.categoryRef || null,
          })));
        }

        if (Array.isArray(costsData)) {
          setCostsList(costsData.map((c: any) => ({
            id: String(c.id),
            name: String(c.name),
            category: c.categoryRef?.name || String(c.category || 'Outros'),
            categoryColor: c.categoryRef?.color || '#737373',
            total: Number(c.total ?? 0),
            due_day: c.due_day ?? null,
            recurrence: c.recurrence || 'MONTHLY',
          })));
        }
      } catch (error) {
        console.error('Erro ao carregar métricas do dashboard', error);
      }
    };
    load();
  }, [selectedMonth]);

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const fmtDate = (d: Date) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(d);

  // ── Aggregates ──
  const totalIncome = useMemo(() => dailyEntries.filter(e => e.type === 'INCOME').reduce((s, e) => s + e.amount, 0), [dailyEntries]);
  const totalExpenses = useMemo(() => dailyEntries.filter(e => e.type === 'EXPENSE').reduce((s, e) => s + e.amount, 0), [dailyEntries]);
  const totalCosts = useMemo(() => costsList.reduce((s, c) => s + c.total, 0), [costsList]);
  const netProfit = totalIncome - totalCosts - totalExpenses;
  const margin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  // ── Upcoming payments ──
  const upcomingPayments = useMemo(() => {
    const monthly = costsList.filter(c => c.recurrence === 'MONTHLY' && c.due_day);
    if (!monthly.length) return [];
    const [y, m] = selectedMonth.split('-').map(Number);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return monthly
      .map(c => ({ ...c, date: new Date(y, m - 1, c.due_day || 1) }))
      .filter(i => (i.date.getFullYear() === todayStart.getFullYear() && i.date.getMonth() === todayStart.getMonth()) ? i.date >= todayStart : true)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 6);
  }, [costsList, selectedMonth]);

  return (
    <div>
      <SectionHeader
        title="Dashboard"
        rightSlot={
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="h-9 px-3 text-sm bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
          />
        }
      />

      {/* ── Hero metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-neutral-200 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden mb-8">
        {/* Lucro — spans full width on mobile, left column on desktop */}
        <div className="col-span-2 lg:col-span-1 lg:row-span-2 bg-white dark:bg-neutral-925 p-6 flex flex-col justify-center">
          <p className="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">Lucro Líquido</p>
          <p className={`text-2xl lg:text-3xl font-semibold font-mono tabular-nums ${netProfit < 0 ? 'text-negative' : 'text-positive'}`}>
            {fmt(netProfit)}
          </p>
          <p className={`text-[13px] font-mono tabular-nums mt-1 ${margin < 0 ? 'text-negative/70' : 'text-neutral-400'}`}>
            {margin.toFixed(1)}% de margem
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-925 p-5">
          <p className="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">Faturamento</p>
          <p className="text-lg font-semibold font-mono tabular-nums text-neutral-900 dark:text-white">{fmt(totalIncome)}</p>
        </div>
        <div className="bg-white dark:bg-neutral-925 p-5">
          <p className="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">Por Sócio (50%)</p>
          <p className={`text-lg font-semibold font-mono tabular-nums ${netProfit < 0 ? 'text-negative' : 'text-neutral-900 dark:text-white'}`}>{fmt(netProfit * 0.5)}</p>
        </div>
        <div className="bg-white dark:bg-neutral-925 p-5">
          <p className="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">Custos Fixos</p>
          <p className="text-lg font-semibold font-mono tabular-nums text-neutral-900 dark:text-white">{fmt(totalCosts)}</p>
        </div>
        <div className="bg-white dark:bg-neutral-925 p-5">
          <p className="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">Despesas</p>
          <p className="text-lg font-semibold font-mono tabular-nums text-neutral-900 dark:text-white">{fmt(totalExpenses)}</p>
        </div>
      </div>

      {/* ── Próximos vencimentos ── */}
      <div>
        <h3 className="text-[13px] font-medium text-neutral-900 dark:text-white mb-4">Próximos vencimentos</h3>
        {upcomingPayments.length === 0 ? (
          <p className="text-[13px] text-neutral-400 dark:text-neutral-600">Nenhum vencimento próximo.</p>
        ) : (
          <div className="space-y-0">
            {upcomingPayments.map(item => (
              <div key={item.id} className="flex justify-between items-center py-2.5 border-b border-neutral-100 dark:border-neutral-800/50 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-neutral-900 dark:text-white truncate">{item.name}</p>
                  <p className="text-[11px] text-neutral-400 font-mono">{fmt(item.total)}</p>
                </div>
                <span className="text-[11px] text-neutral-500 ml-4 whitespace-nowrap">{fmtDate(item.date)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
