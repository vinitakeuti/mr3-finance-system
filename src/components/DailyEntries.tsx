'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { SectionHeader } from './SectionHeader';

type EntryType = 'INCOME' | 'EXPENSE';

interface CostCategory {
  id: string;
  name: string;
  color: string;
}

interface DailyEntry {
  id: string;
  date: string;
  type: EntryType;
  amount: number;
  description: string | null;
  category_id: string | null;
  categoryRef: CostCategory | null;
}

interface DaySummary {
  date: string;
  income: number;
  expense: number;
  entries: DailyEntry[];
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtDateBR(s: string): string {
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

export function DailyEntries() {
  const today = toDateStr(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(() => today.slice(0, 7));
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [categories, setCategories] = useState<CostCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick-add form
  const [formType, setFormType] = useState<EntryType>('INCOME');
  const [formAmount, setFormAmount] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  const loadEntries = useCallback(async (month: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/daily-entries?month=${encodeURIComponent(month)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setEntries(data.map(mapEntry));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadEntries(selectedMonth); }, [selectedMonth, loadEntries]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/cost-categories');
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) setCategories(data.map((c: any) => ({ id: c.id, name: c.name, color: c.color })));
      } catch (e) { console.error(e); }
    })();
  }, []);

  // Group entries by day
  const byDay = useMemo(() => {
    const map: Record<string, DaySummary> = {};
    for (const e of entries) {
      const d = e.date.slice(0, 10);
      if (!map[d]) map[d] = { date: d, income: 0, expense: 0, entries: [] };
      map[d].entries.push(e);
      if (e.type === 'INCOME') map[d].income += e.amount;
      else map[d].expense += e.amount;
    }
    return map;
  }, [entries]);

  const selectedDayEntries = useMemo(() => {
    return (byDay[selectedDate]?.entries || []).sort((a, b) => {
      if (a.type !== b.type) return a.type === 'INCOME' ? -1 : 1;
      return b.amount - a.amount;
    });
  }, [byDay, selectedDate]);

  const selectedDaySummary = byDay[selectedDate] || { income: 0, expense: 0 };

  const monthTotals = useMemo(() => {
    let income = 0, expense = 0;
    for (const e of entries) {
      if (e.type === 'INCOME') income += e.amount;
      else expense += e.amount;
    }
    return { income, expense, balance: income - expense };
  }, [entries]);

  // Calendar data
  const [calYear, calMonth] = selectedMonth.split('-').map(Number);
  const firstDay = new Date(calYear, calMonth - 1, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const calBlanks = Array.from({ length: firstDay }, () => null);
  const calDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => {
    const d = new Date(calYear, calMonth - 2, 1);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(m);
    setSelectedDate(`${m}-01`);
  };
  const nextMonth = () => {
    const d = new Date(calYear, calMonth, 1);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(m);
    setSelectedDate(`${m}-01`);
  };

  const selectDay = (day: number) => {
    setSelectedDate(`${selectedMonth}-${String(day).padStart(2, '0')}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || parseFloat(formAmount) <= 0) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/daily-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          type: formType,
          amount: formAmount,
          description: formDesc || null,
          category_id: formType === 'EXPENSE' ? formCategoryId || null : null,
        }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.error || 'Erro'); }
      const created = await res.json();
      setEntries(prev => [mapEntry(created), ...prev]);
      setFormAmount('');
      setFormDesc('');
      setFormCategoryId('');
      amountRef.current?.focus();
    } catch (err: any) { alert(err.message || 'Erro ao salvar.'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este lançamento?')) return;
    try {
      const res = await fetch(`/api/daily-entries/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir');
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err: any) { alert(err.message); }
  };

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const inp = "w-full h-10 px-3 text-sm bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors";

  return (
    <div>
      <SectionHeader title="Lançamentos" />

      {/* Month totals */}
      <div className="grid grid-cols-3 gap-px bg-neutral-200 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden mb-6">
        <div className="bg-white dark:bg-neutral-925 p-4">
          <p className="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">Entradas</p>
          <p className="text-base font-semibold font-mono tabular-nums text-positive">{fmt(monthTotals.income)}</p>
        </div>
        <div className="bg-white dark:bg-neutral-925 p-4">
          <p className="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">Saídas</p>
          <p className="text-base font-semibold font-mono tabular-nums text-negative">{fmt(monthTotals.expense)}</p>
        </div>
        <div className="bg-white dark:bg-neutral-925 p-4">
          <p className="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">Saldo</p>
          <p className={`text-base font-semibold font-mono tabular-nums ${monthTotals.balance >= 0 ? 'text-neutral-900 dark:text-white' : 'text-negative'}`}>{fmt(monthTotals.balance)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Left: Calendar */}
        <div>
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <button onClick={prevMonth} className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-[13px] font-medium text-neutral-900 dark:text-white">{MONTHS_PT[calMonth - 1]} {calYear}</span>
              <button onClick={nextMonth} className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-7 gap-0">
              {WEEKDAYS.map(d => <div key={d} className="text-center text-[10px] uppercase tracking-wider text-neutral-400 py-1">{d}</div>)}
              {calBlanks.map((_, i) => <div key={`b-${i}`} />)}
              {calDays.map(day => {
                const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === today;
                const dayData = byDay[dateStr];
                const hasIncome = dayData && dayData.income > 0;
                const hasExpense = dayData && dayData.expense > 0;

                return (
                  <button
                    key={day}
                    onClick={() => selectDay(day)}
                    className={`relative h-10 w-full rounded-md text-[13px] transition-colors ${
                      isSelected
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium'
                        : isToday
                          ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    {day}
                    {/* Activity dots */}
                    {(hasIncome || hasExpense) && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                        {hasIncome && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/60 dark:bg-neutral-900/60' : 'bg-positive'}`} />}
                        {hasExpense && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/60 dark:bg-neutral-900/60' : 'bg-negative'}`} />}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Selected day */}
        <div>
          {/* Day header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-medium text-neutral-900 dark:text-white">{fmtDateBR(selectedDate)}</h3>
              {(selectedDaySummary.income > 0 || selectedDaySummary.expense > 0) && (
                <p className="text-[12px] text-neutral-400 mt-0.5">
                  <span className="text-positive">{fmt(selectedDaySummary.income)}</span>
                  {' / '}
                  <span className="text-negative">{fmt(selectedDaySummary.expense)}</span>
                </p>
              )}
            </div>
          </div>

          {/* Quick-add form */}
          <form onSubmit={handleSubmit} className="mb-6">
            {/* Type toggle */}
            <div className="flex mb-3 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden h-10">
              <button
                type="button"
                onClick={() => setFormType('INCOME')}
                className={`flex-1 flex items-center justify-center gap-1.5 text-[13px] font-medium transition-colors ${
                  formType === 'INCOME'
                    ? 'bg-positive/10 text-positive'
                    : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" /> Entrada
              </button>
              <div className="w-px bg-neutral-200 dark:bg-neutral-800" />
              <button
                type="button"
                onClick={() => setFormType('EXPENSE')}
                className={`flex-1 flex items-center justify-center gap-1.5 text-[13px] font-medium transition-colors ${
                  formType === 'EXPENSE'
                    ? 'bg-negative/10 text-negative'
                    : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" /> Saída
              </button>
            </div>

            <div className="flex gap-2 mb-2">
              <div className="flex-1">
                <input
                  ref={amountRef}
                  type="number"
                  step="0.01"
                  min="0"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  className={inp}
                  placeholder="Valor (R$)"
                  required
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  className={inp}
                  placeholder="Descrição (opcional)"
                />
              </div>
            </div>

            <div className="flex gap-2">
              {formType === 'EXPENSE' && categories.length > 0 && (
                <select
                  value={formCategoryId}
                  onChange={e => setFormCategoryId(e.target.value)}
                  className={`${inp} flex-1`}
                >
                  <option value="">Categoria (opcional)</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
              <button
                type="submit"
                disabled={submitting || !formAmount}
                className={`inline-flex items-center justify-center gap-1.5 h-10 px-5 text-[13px] font-medium rounded-lg transition-colors disabled:opacity-40 ${
                  formType === 'INCOME'
                    ? 'bg-positive text-white hover:bg-positive/90'
                    : 'bg-negative text-white hover:bg-negative/90'
                } ${formType === 'EXPENSE' && categories.length === 0 ? 'flex-1' : ''}`}
              >
                <Plus className="w-4 h-4" /> {submitting ? 'Salvando...' : 'Lançar'}
              </button>
            </div>
          </form>

          {/* Day entries list */}
          {loading ? (
            <p className="text-[13px] text-neutral-400 py-8 text-center">Carregando...</p>
          ) : selectedDayEntries.length === 0 ? (
            <p className="text-[13px] text-neutral-400 dark:text-neutral-600 py-8 text-center">Nenhum lançamento neste dia.</p>
          ) : (
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
              {selectedDayEntries.map((entry, i) => (
                <div key={entry.id} className={`flex items-center gap-3 px-4 py-3 group ${i < selectedDayEntries.length - 1 ? 'border-b border-neutral-100 dark:border-neutral-800/50' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    entry.type === 'INCOME' ? 'bg-positive/10' : 'bg-negative/10'
                  }`}>
                    {entry.type === 'INCOME'
                      ? <ArrowDownLeft className="w-3.5 h-3.5 text-positive" />
                      : <ArrowUpRight className="w-3.5 h-3.5 text-negative" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] text-neutral-900 dark:text-white truncate">
                        {entry.description || (entry.type === 'INCOME' ? 'Entrada' : 'Saída')}
                      </p>
                      {entry.categoryRef && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-neutral-400 flex-shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.categoryRef.color }} />
                          {entry.categoryRef.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-[13px] font-mono tabular-nums font-medium flex-shrink-0 ${
                    entry.type === 'INCOME' ? 'text-positive' : 'text-negative'
                  }`}>
                    {entry.type === 'INCOME' ? '+' : '-'}{fmt(entry.amount)}
                  </span>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-1 text-neutral-300 dark:text-neutral-700 hover:text-negative opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function mapEntry(i: any): DailyEntry {
  return {
    id: String(i.id),
    date: String(i.date),
    type: i.type as EntryType,
    amount: Number(i.amount ?? 0),
    description: i.description || null,
    category_id: i.category_id || null,
    categoryRef: i.categoryRef || null,
  };
}
