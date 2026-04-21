'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText, ChevronDown } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import jsPDF from 'jspdf';

interface DailyEntry {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  date: string;
  description: string | null;
  categoryRef: { id: string; name: string; color: string } | null;
}

interface CostItem { id: string; name: string; category: string; total: number; categoryRef: { id: string; name: string; color: string } | null }

export function Revenue() {
  const [dailyEntries, setDailyEntries] = useState<DailyEntry[]>([]);
  const [costs, setCosts] = useState<CostItem[]>([]);
  const [expandedCosts, setExpandedCosts] = useState<Set<string>>(new Set());
  const [expandedExpenses, setExpandedExpenses] = useState<Set<string>>(new Set());
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Load daily entries for selected month
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/daily-entries?month=${encodeURIComponent(selectedMonth)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) {
          setDailyEntries(data.map((e: any) => ({
            id: String(e.id),
            type: e.type as 'INCOME' | 'EXPENSE',
            amount: Number(e.amount ?? 0),
            date: String(e.date),
            description: e.description || null,
            categoryRef: e.categoryRef || null,
          })));
        }
      } catch (e) { console.error(e); }
    })();
  }, [selectedMonth]);

  // Load costs for selected month
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/costs?month=${encodeURIComponent(selectedMonth)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data)) { setCosts([]); return; }
        setCosts(data.map((c: any) => ({
          id: String(c.id),
          name: String(c.name),
          category: c.categoryRef?.name || String(c.category || 'Sem categoria'),
          total: Number(c.total ?? 0),
          categoryRef: c.categoryRef || null,
        })));
      } catch (e) { console.error(e); }
    })();
  }, [selectedMonth]);

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  // Aggregated values from daily entries
  const totalIncome = useMemo(() => dailyEntries.filter(e => e.type === 'INCOME').reduce((s, e) => s + e.amount, 0), [dailyEntries]);
  const totalExpenses = useMemo(() => dailyEntries.filter(e => e.type === 'EXPENSE').reduce((s, e) => s + e.amount, 0), [dailyEntries]);
  const totalCosts = useMemo(() => costs.reduce((s, c) => s + c.total, 0), [costs]);
  const net = totalIncome - totalCosts - totalExpenses;
  const margin = totalIncome > 0 ? (net / totalIncome) * 100 : 0;
  const incomeEntries = useMemo(() => dailyEntries.filter(e => e.type === 'INCOME'), [dailyEntries]);
  const expenseEntries = useMemo(() => dailyEntries.filter(e => e.type === 'EXPENSE'), [dailyEntries]);

  const { positiveDays, negativeDays } = useMemo(() => {
    const byDay: Record<string, number> = {};
    for (const e of dailyEntries) {
      const d = e.date.slice(0, 10);
      if (!byDay[d]) byDay[d] = 0;
      byDay[d] += e.type === 'INCOME' ? e.amount : -e.amount;
    }
    let pos = 0, neg = 0;
    for (const bal of Object.values(byDay)) {
      if (bal >= 0) pos++; else neg++;
    }
    return { positiveDays: pos, negativeDays: neg };
  }, [dailyEntries]);

  // Group costs by category with color
  const costsByCategory = useMemo(() => {
    const map: Record<string, { total: number; color: string; items: CostItem[] }> = {};
    for (const c of costs) {
      const key = c.category;
      if (!map[key]) map[key] = { total: 0, color: c.categoryRef?.color || '#737373', items: [] };
      map[key].total += c.total;
      map[key].items.push(c);
    }
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [costs]);

  // Unified outflow breakdown (costs + expenses merged by category)
  const totalOut = totalCosts + totalExpenses;
  const outflowBreakdown = useMemo(() => {
    const map: Record<string, { total: number; color: string }> = {};
    for (const c of costs) {
      const key = c.category;
      const color = c.categoryRef?.color || '#737373';
      if (!map[key]) map[key] = { total: 0, color };
      map[key].total += c.total;
    }
    for (const e of dailyEntries.filter(e => e.type === 'EXPENSE')) {
      const key = e.categoryRef?.name || 'Sem categoria';
      const color = e.categoryRef?.color || '#a3a3a3';
      if (!map[key]) map[key] = { total: 0, color };
      map[key].total += e.amount;
    }
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [costs, dailyEntries]);

  const maxOutflow = useMemo(() => {
    if (!outflowBreakdown.length) return 1;
    return outflowBreakdown[0][1].total || 1;
  }, [outflowBreakdown]);

  // Group daily expenses by category (with individual items)
  const expensesByCategory = useMemo(() => {
    const expenses = dailyEntries.filter(e => e.type === 'EXPENSE');
    const map: Record<string, { total: number; color: string; items: { description: string; amount: number; date: string }[] }> = {};
    for (const e of expenses) {
      const key = e.categoryRef?.name || 'Sem categoria';
      const color = e.categoryRef?.color || '#737373';
      if (!map[key]) map[key] = { total: 0, color, items: [] };
      map[key].total += e.amount;
      map[key].items.push({
        description: e.description || 'Sem descrição',
        amount: e.amount,
        date: e.date,
      });
    }
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [dailyEntries]);

  const handlePdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text('Resumo Financeiro', 20, 20);
    doc.setFontSize(11);
    doc.text(`Mês: ${selectedMonth}`, 20, 32);
    doc.text(`Faturamento (entradas): ${fmt(totalIncome)}`, 20, 40);
    let yPos = 48;
    doc.text(`Custos cadastrados: ${fmt(totalCosts)}`, 20, yPos); yPos += 8;
    for (const [catName, group] of costsByCategory) {
      doc.text(`  ${catName}: ${fmt(group.total)}`, 20, yPos); yPos += 6;
    }
    yPos += 2;
    doc.text(`Saídas diárias: ${fmt(totalExpenses)}`, 20, yPos); yPos += 8;
    for (const [catName, group] of expensesByCategory) {
      doc.text(`  ${catName}: ${fmt(group.total)}`, 20, yPos); yPos += 6;
    }
    yPos += 2;
    doc.text(`Lucro líquido: ${fmt(net)}`, 20, yPos); yPos += 8;
    doc.text(`Margem líquida: ${margin.toFixed(1)}%`, 20, yPos);
    doc.save(`resumo-${selectedMonth}.pdf`);
  };

  return (
    <div>
      <SectionHeader
        title="Resumo"
        rightSlot={
          <div className="flex items-center gap-2">
            <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="h-9 px-3 text-sm bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors" />
            <button type="button" onClick={handlePdf} className="inline-flex items-center gap-1.5 h-9 px-3 text-[13px] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
              <FileText className="w-4 h-4" /> PDF
            </button>
          </div>
        }
      />

      {/* Top-level metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-neutral-200 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden mb-8">
        {[
          { label: 'Faturamento', value: fmt(totalIncome), negative: false },
          { label: 'Lucro Líquido', value: fmt(net), negative: net < 0 },
          { label: 'Margem Líquida', value: margin.toFixed(1) + '%', negative: margin < 0 },
        ].map(item => (
          <div key={item.label} className="bg-white dark:bg-neutral-925 p-4 sm:p-5 flex items-center justify-between sm:block">
            <p className="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 sm:mb-2">{item.label}</p>
            <p className={`text-base sm:text-lg font-semibold font-mono tabular-nums ${item.negative ? 'text-negative' : 'text-neutral-900 dark:text-white'}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Cost breakdown by category */}
      {costs.length > 0 && (
        <div className="mb-8">
          <h3 className="text-[13px] font-medium text-neutral-900 dark:text-white mb-4">Custos cadastrados</h3>
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
              {costsByCategory.map(([catName, group]) => {
                const isOpen = expandedCosts.has(catName);
                return (
                  <div key={catName} className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setExpandedCosts(prev => {
                        const next = new Set(prev);
                        if (next.has(catName)) next.delete(catName); else next.add(catName);
                        return next;
                      })}
                      className="w-full flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: group.color }} />
                        <span className="text-[13px] text-neutral-900 dark:text-white font-medium">{catName}</span>
                        <span className="text-[11px] text-neutral-400">{group.items.length} custo{group.items.length !== 1 ? 's' : ''}</span>
                      </div>
                      <span className="text-[13px] font-mono tabular-nums text-neutral-900 dark:text-white">{fmt(group.total)}</span>
                    </button>
                    {isOpen && (
                      <div className="mt-2 ml-6 space-y-1 max-h-40 overflow-y-auto">
                        {group.items.map(item => (
                          <div key={item.id} className="flex items-center justify-between">
                            <span className="text-[12px] text-neutral-400">{item.name}</span>
                            <span className="text-[12px] font-mono tabular-nums text-neutral-500">{fmt(item.total)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
              <span className="text-[13px] font-medium text-neutral-900 dark:text-white">Total de custos</span>
              <span className="text-sm font-semibold font-mono tabular-nums text-neutral-900 dark:text-white">{fmt(totalCosts)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Daily expenses breakdown */}
      {expensesByCategory.length > 0 && (
        <div className="mb-8">
          <h3 className="text-[13px] font-medium text-neutral-900 dark:text-white mb-4">Saídas do mês</h3>
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
              {expensesByCategory.map(([catName, group]) => {
                const isOpen = expandedExpenses.has(catName);
                return (
                  <div key={catName} className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setExpandedExpenses(prev => {
                        const next = new Set(prev);
                        if (next.has(catName)) next.delete(catName); else next.add(catName);
                        return next;
                      })}
                      className="w-full flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: group.color }} />
                        <span className="text-[13px] text-neutral-900 dark:text-white font-medium">{catName}</span>
                        <span className="text-[11px] text-neutral-400">{group.items.length} lançamento{group.items.length !== 1 ? 's' : ''}</span>
                      </div>
                      <span className="text-[13px] font-mono tabular-nums text-neutral-900 dark:text-white">{fmt(group.total)}</span>
                    </button>
                    {isOpen && (
                      <div className="mt-2 ml-6 space-y-1 max-h-40 overflow-y-auto">
                        {group.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="text-[12px] text-neutral-400 truncate">{item.description}</span>
                            <span className="text-[12px] font-mono tabular-nums text-neutral-500 ml-3 flex-shrink-0">{fmt(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
              <span className="text-[13px] font-medium text-neutral-900 dark:text-white">Total de saídas</span>
              <span className="text-sm font-semibold font-mono tabular-nums text-neutral-900 dark:text-white">{fmt(totalExpenses)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Outflow breakdown with bars */}
      {outflowBreakdown.length > 0 && (
        <div className="mb-8">
          <h3 className="text-[13px] font-medium text-neutral-900 dark:text-white mb-4">Destino dos gastos</h3>
          <div className="space-y-3">
            {outflowBreakdown.map(([name, data]) => {
              const pct = totalOut > 0 ? (data.total / totalOut) * 100 : 0;
              const barW = Math.max((data.total / maxOutflow) * 100, 2);
              return (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: data.color }} />
                      <span className="text-[13px] text-neutral-700 dark:text-neutral-300 truncate">{name}</span>
                      <span className="text-[11px] text-neutral-400 flex-shrink-0">{pct.toFixed(0)}%</span>
                    </div>
                    <span className="text-[13px] font-mono tabular-nums text-neutral-900 dark:text-white ml-3 flex-shrink-0">{fmt(data.total)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${barW}%`, backgroundColor: data.color }} />
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-neutral-200 dark:border-neutral-800">
              <span className="text-[13px] font-medium text-neutral-900 dark:text-white">Total de gastos</span>
              <span className="text-sm font-semibold font-mono tabular-nums text-neutral-900 dark:text-white">{fmt(totalOut)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Profit waterfall */}
      <div className="mb-8">
        <h3 className="text-[13px] font-medium text-neutral-900 dark:text-white mb-4">Composição do resultado</h3>
        <div className="space-y-0">
          <div className="flex justify-between items-center py-3 border-b border-neutral-100 dark:border-neutral-800/50">
            <span className="text-[13px] text-neutral-500">Faturamento (entradas)</span>
            <span className="text-[13px] font-mono tabular-nums text-neutral-900 dark:text-white">{fmt(totalIncome)}</span>
          </div>
          {costsByCategory.map(([catName, group]) => (
            <div key={catName} className="flex justify-between items-center py-3 border-b border-neutral-100 dark:border-neutral-800/50">
              <span className="text-[13px] text-neutral-500 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} />
                (-) {catName}
              </span>
              <span className="text-[13px] font-mono tabular-nums text-negative">{fmt(group.total)}</span>
            </div>
          ))}
          {expensesByCategory.map(([catName, group]) => (
            <div key={catName} className="flex justify-between items-center py-3 border-b border-neutral-100 dark:border-neutral-800/50">
              <span className="text-[13px] text-neutral-500 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} />
                (-) Saída: {catName}
              </span>
              <span className="text-[13px] font-mono tabular-nums text-negative">{fmt(group.total)}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-3">
            <span className="text-[13px] font-semibold text-neutral-900 dark:text-white">= Lucro líquido</span>
            <span className={`text-sm font-semibold font-mono tabular-nums ${net < 0 ? 'text-negative' : 'text-positive'}`}>{fmt(net)}</span>
          </div>
        </div>
      </div>

      {/* Additional metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-neutral-200 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
        <div className="bg-white dark:bg-neutral-925 p-4 sm:p-5">
          <p className="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">Total de entradas</p>
          <p className="text-lg font-semibold font-mono tabular-nums text-positive">{incomeEntries.length}</p>
        </div>
        <div className="bg-white dark:bg-neutral-925 p-4 sm:p-5">
          <p className="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">Total de saídas</p>
          <p className="text-lg font-semibold font-mono tabular-nums text-negative">{expenseEntries.length}</p>
        </div>
        <div className="bg-white dark:bg-neutral-925 p-4 sm:p-5">
          <p className="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">Dias positivos</p>
          <p className="text-lg font-semibold font-mono tabular-nums text-positive">{positiveDays}</p>
        </div>
        <div className="bg-white dark:bg-neutral-925 p-4 sm:p-5">
          <p className="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">Dias negativos</p>
          <p className="text-lg font-semibold font-mono tabular-nums text-negative">{negativeDays}</p>
        </div>
      </div>
    </div>
  );
}
