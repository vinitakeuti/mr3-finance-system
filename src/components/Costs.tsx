'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, X, Calculator, ChevronLeft, ChevronRight, Calendar, Settings, ArrowLeft } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { ColorPicker } from './ColorPicker';

type CalcType = 'FIXED' | 'PERCENTAGE' | 'PER_UNIT';
type Recurrence = 'MONTHLY' | 'ONE_TIME';
type SubView = 'costs' | 'categories';

interface CostCategory {
  id: string;
  name: string;
  color: string;
  description: string | null;
  sort_order: number;
  _count: { costs: number };
}

interface Cost {
  id: string;
  name: string;
  description: string | null;
  category: string;
  category_id: string | null;
  categoryRef: { id: string; name: string; color: string } | null;
  recurrence: Recurrence;
  month: string | null;
  due_day: number | null;
  calc_type: CalcType;
  amount: number;
  quantity: number | null;
  reference_value: number | null;
  total: number;
  is_active: boolean;
}

const CALC_LABELS: Record<CalcType, string> = {
  FIXED: 'Valor fixo',
  PERCENTAGE: 'Percentual (%)',
  PER_UNIT: 'Por unidade',
};

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// ─── Day Picker ───────────────────────────────────────────────

function DayPicker({ value, onChange, onClose }: { value: number | null; onChange: (day: number) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };
  const blanks: null[] = Array.from({ length: firstDay }, () => null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div ref={ref} className="absolute z-50 top-full mt-1.5 left-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg p-3 w-[280px] animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={prevMonth} className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-[13px] font-medium text-neutral-900 dark:text-white">{MONTHS_PT[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth} className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"><ChevronRight className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-0">
        {WEEKDAYS.map(d => <div key={d} className="text-center text-[10px] uppercase tracking-wider text-neutral-400 py-1.5">{d}</div>)}
        {blanks.map((_, i) => <div key={`b-${i}`} />)}
        {days.map(day => {
          const isSelected = day === value;
          const isToday = day === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear();
          return (
            <button key={day} type="button" onClick={() => { onChange(day); onClose(); }}
              className={`h-8 w-full rounded-md text-[13px] transition-colors ${isSelected ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium' : isToday ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
            >{day}</button>
          );
        })}
      </div>
    </div>
  );
}

function formatDueDay(day: number | null): string {
  if (!day) return '';
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), day);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Category Management Sub-View ─────────────────────────────

function CategoriesView({ categories, onBack, onRefresh }: {
  categories: CostCategory[];
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('#737373');
  const [formDesc, setFormDesc] = useState('');
  const [showForm, setShowForm] = useState(false);

  const inp = "w-full h-10 px-3 text-sm bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors";

  const resetForm = () => { setFormName(''); setFormColor('#737373'); setFormDesc(''); setEditingId(null); setShowForm(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const payload = { name: formName.trim(), color: formColor, description: formDesc || null };

    try {
      if (editingId) {
        const res = await fetch(`/api/cost-categories/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.error || 'Erro ao atualizar'); }
      } else {
        const res = await fetch('/api/cost-categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.error || 'Erro ao criar'); }
      }
      resetForm();
      onRefresh();
    } catch (err: any) { alert(err.message || 'Erro ao salvar.'); }
  };

  const handleEdit = (cat: CostCategory) => {
    setEditingId(cat.id);
    setFormName(cat.name);
    setFormColor(cat.color);
    setFormDesc(cat.description || '');
    setShowForm(true);
  };

  const handleDelete = async (cat: CostCategory) => {
    const msg = cat._count.costs > 0
      ? `A categoria "${cat.name}" possui ${cat._count.costs} custo(s) vinculado(s). Eles serão desvinculados. Deseja continuar?`
      : `Deseja excluir a categoria "${cat.name}"?`;
    if (!confirm(msg)) return;
    try {
      const res = await fetch(`/api/cost-categories/${cat.id}`, { method: 'DELETE' });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.error || 'Erro ao excluir'); }
      onRefresh();
    } catch (err: any) { alert(err.message || 'Erro ao excluir.'); }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors">
          <ArrowLeft className="w-[18px] h-[18px]" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">Categorias de Custo</h2>
          <p className="text-[13px] text-neutral-400 mt-0.5">Gerencie as categorias usadas para organizar seus custos</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="inline-flex items-center gap-1.5 h-9 px-3 text-[13px] font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
          <Plus className="w-4 h-4" /> Nova categoria
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-8 border border-neutral-200 dark:border-neutral-800 rounded-lg p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-medium text-neutral-900 dark:text-white">{editingId ? 'Editar categoria' : 'Nova categoria'}</h3>
            <button onClick={resetForm} className="text-neutral-400 hover:text-neutral-600 transition-colors"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Nome</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} required className={inp} placeholder="Ex: Tráfego, Ferramentas..." />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Cor</label>
                <div className="pt-1.5">
                  <ColorPicker value={formColor} onChange={setFormColor} />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Descrição</label>
              <input type="text" value={formDesc} onChange={e => setFormDesc(e.target.value)} className={inp} placeholder="Opcional" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="h-9 px-4 text-[13px] font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">{editingId ? 'Atualizar' : 'Criar'}</button>
              <button type="button" onClick={resetForm} className="h-9 px-4 text-[13px] text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Categories list */}
      {categories.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[13px] text-neutral-400 dark:text-neutral-600 mb-3">Nenhuma categoria criada.</p>
          <p className="text-[12px] text-neutral-400 dark:text-neutral-600">Crie categorias para organizar seus custos por tipo (ex: Tráfego, Ferramentas, Funcionários).</p>
        </div>
      ) : (
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-neutral-400 dark:text-neutral-500">Categoria</th>
                <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-neutral-400 dark:text-neutral-500 hidden sm:table-cell">Descrição</th>
                <th className="text-center px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-neutral-400 dark:text-neutral-500">Custos</th>
                <th className="w-20 px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-[13px] text-neutral-900 dark:text-white font-medium">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-neutral-400 hidden sm:table-cell">{cat.description || '—'}</td>
                  <td className="px-4 py-3 text-center text-[13px] font-mono tabular-nums text-neutral-500">{cat._count.costs}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(cat)} className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(cat)} className="p-1.5 text-neutral-400 hover:text-negative transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Cost Form (shared between inline + modal) ──────────────

function CostForm({ formData, setFormData, dbCategories, showDayPicker, setShowDayPicker, dueDayNum, computePreview, handleSubmit, resetForm, editingId, inp }: {
  formData: typeof emptyForm;
  setFormData: (fn: any) => void;
  dbCategories: CostCategory[];
  showDayPicker: boolean;
  setShowDayPicker: (fn: any) => void;
  dueDayNum: number | null;
  computePreview: () => number;
  handleSubmit: (e: React.FormEvent) => void;
  resetForm: () => void;
  editingId: string | null;
  inp: string;
}) {
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Nome</label>
          <input type="text" value={formData.name} onChange={e => setFormData((prev: any) => ({ ...prev, name: e.target.value }))} required className={inp} placeholder="Ex: Servidor, Gateway..." />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Categoria</label>
          <div className="flex flex-wrap gap-2">
            {dbCategories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFormData((prev: any) => ({ ...prev, category_id: cat.id }))}
                className={`inline-flex items-center gap-1.5 h-9 px-3 text-[13px] rounded-lg border transition-all ${
                  formData.category_id === cat.id
                    ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-600'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: formData.category_id === cat.id ? 'currentColor' : cat.color }} />
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Recorrência</label>
          <select value={formData.recurrence} onChange={e => setFormData((prev: any) => ({ ...prev, recurrence: e.target.value as Recurrence }))} className={inp}>
            <option value="MONTHLY">Mensal (fixo)</option>
            <option value="ONE_TIME">Pontual (este mês)</option>
          </select>
        </div>
        {formData.recurrence === 'MONTHLY' && (
          <div className="relative">
            <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Dia de vencimento</label>
            <button type="button" onClick={() => setShowDayPicker((p: boolean) => !p)} className={`${inp} flex items-center justify-between text-left`}>
              <span className={dueDayNum ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'}>
                {dueDayNum ? formatDueDay(dueDayNum) : 'Selecionar dia...'}
              </span>
              <Calendar className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            </button>
            {showDayPicker && (
              <DayPicker value={dueDayNum} onChange={day => setFormData((prev: any) => ({ ...prev, due_day: String(day) }))} onClose={() => setShowDayPicker(false)} />
            )}
          </div>
        )}
      </div>

      {/* Calculation section */}
      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/50">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-[11px] uppercase tracking-wider text-neutral-400">Cálculo</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Tipo</label>
            <select value={formData.calc_type} onChange={e => setFormData((prev: any) => ({ ...prev, calc_type: e.target.value as CalcType }))} className={inp}>
              <option value="FIXED">Valor fixo</option>
              <option value="PER_UNIT">Por unidade (qtd x valor)</option>
              <option value="PERCENTAGE">Percentual (%)</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">
              {formData.calc_type === 'FIXED' ? 'Valor (R$)' : formData.calc_type === 'PER_UNIT' ? 'Valor unitário (R$)' : 'Taxa (%)'}
            </label>
            <input type="number" step="0.01" min="0" value={formData.amount} onChange={e => setFormData((prev: any) => ({ ...prev, amount: e.target.value }))} required className={inp} placeholder="0,00" />
          </div>
          {formData.calc_type === 'PER_UNIT' && (
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Quantidade</label>
              <input type="number" min="0" value={formData.quantity} onChange={e => setFormData((prev: any) => ({ ...prev, quantity: e.target.value }))} required className={inp} placeholder="0" />
            </div>
          )}
          {formData.calc_type === 'PERCENTAGE' && (
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Valor base (R$)</label>
              <input type="number" step="0.01" min="0" value={formData.reference_value} onChange={e => setFormData((prev: any) => ({ ...prev, reference_value: e.target.value }))} required className={inp} placeholder="0,00" />
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[11px] text-neutral-400">Total calculado:</span>
          <span className="text-[13px] font-mono tabular-nums font-medium text-neutral-900 dark:text-white">{fmt(computePreview())}</span>
        </div>
      </div>

      <div>
        <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Descrição</label>
        <textarea value={formData.description} onChange={e => setFormData((prev: any) => ({ ...prev, description: e.target.value }))} rows={2} className={`${inp} h-auto py-2`} placeholder="Opcional" />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="h-9 px-4 text-[13px] font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">{editingId ? 'Atualizar' : 'Salvar'}</button>
        <button type="button" onClick={resetForm} className="h-9 px-4 text-[13px] text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">Cancelar</button>
      </div>
    </form>
  );
}

// ─── Main Costs Component ─────────────────────────────────────

const emptyForm = {
  name: '',
  description: '',
  category_id: '',
  recurrence: 'MONTHLY' as Recurrence,
  month: '',
  due_day: '',
  calc_type: 'FIXED' as CalcType,
  amount: '',
  quantity: '',
  reference_value: '',
};

export function Costs() {
  const [subView, setSubView] = useState<SubView>('costs');
  const [costs, setCosts] = useState<Cost[]>([]);
  const [dbCategories, setDbCategories] = useState<CostCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [formData, setFormData] = useState({ ...emptyForm });
  const [showDayPicker, setShowDayPicker] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/cost-categories');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setDbCategories(data);
    } catch (e) { console.error('Erro ao carregar categorias', e); }
  }, []);

  // Load categories on mount
  useEffect(() => { loadCategories(); }, [loadCategories]);

  // Load costs for selected month
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/costs?month=${encodeURIComponent(selectedMonth)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data)) { setCosts([]); return; }
        setCosts(data.map(mapCost));
      } catch (e) { console.error('Erro ao carregar custos', e); }
      finally { setLoading(false); }
    })();
  }, [selectedMonth]);

  const computePreview = () => {
    const amt = parseFloat(formData.amount) || 0;
    const qty = parseInt(formData.quantity) || 0;
    const ref = parseFloat(formData.reference_value) || 0;
    switch (formData.calc_type) {
      case 'PER_UNIT': return amt * qty;
      case 'PERCENTAGE': return ref * (amt / 100);
      default: return amt;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category_id) { alert('Selecione uma categoria.'); return; }

    const payload = {
      name: formData.name,
      description: formData.description || null,
      category_id: formData.category_id,
      recurrence: formData.recurrence,
      month: formData.recurrence === 'ONE_TIME' ? selectedMonth : null,
      due_day: formData.due_day || null,
      calc_type: formData.calc_type,
      amount: formData.amount,
      quantity: formData.calc_type === 'PER_UNIT' ? formData.quantity : null,
      reference_value: formData.calc_type === 'PERCENTAGE' ? formData.reference_value : null,
    };

    try {
      if (editingId) {
        const res = await fetch(`/api/costs/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.error || 'Erro ao atualizar'); }
        const u = await res.json();
        setCosts(prev => prev.map(c => c.id === editingId ? mapCost(u) : c));
      } else {
        const res = await fetch('/api/costs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.error || 'Erro ao criar'); }
        const c = await res.json();
        setCosts(prev => [...prev, mapCost(c)]);
      }
      resetForm();
      loadCategories(); // refresh counts
    } catch (err: any) { console.error(err); alert(err.message || 'Erro ao salvar.'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este custo?')) return;
    try {
      const res = await fetch(`/api/costs/${id}`, { method: 'DELETE' });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.error || 'Erro ao excluir'); }
      setCosts(prev => prev.filter(c => c.id !== id));
      loadCategories();
    } catch (err: any) { console.error(err); alert(err.message || 'Erro ao excluir.'); }
  };

  const handleEdit = (cost: Cost) => {
    setEditingId(cost.id);
    setFormData({
      name: cost.name,
      description: cost.description || '',
      category_id: cost.category_id || '',
      recurrence: cost.recurrence,
      month: cost.month || '',
      due_day: cost.due_day?.toString() || '',
      calc_type: cost.calc_type,
      amount: cost.amount.toString(),
      quantity: cost.quantity?.toString() || '',
      reference_value: cost.reference_value?.toString() || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ ...emptyForm });
    setEditingId(null);
    setShowForm(false);
    setShowDayPicker(false);
  };

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  // Group by category, using categoryRef color
  const grouped = useMemo(() => {
    const g: Record<string, { costs: Cost[]; color: string }> = {};
    for (const c of costs) {
      const k = c.categoryRef?.name || c.category || 'Sem categoria';
      if (!g[k]) g[k] = { costs: [], color: c.categoryRef?.color || '#737373' };
      g[k].costs.push(c);
    }
    return g;
  }, [costs]);

  const totalCosts = useMemo(() => costs.reduce((s, c) => s + c.total, 0), [costs]);
  const categoryTotals = useMemo(() => {
    const t: Record<string, number> = {};
    for (const c of costs) { const k = c.categoryRef?.name || c.category || 'Sem categoria'; t[k] = (t[k] || 0) + c.total; }
    return t;
  }, [costs]);

  const calcDetail = (cost: Cost) => {
    if (cost.calc_type === 'PER_UNIT' && cost.quantity) return `${cost.quantity} x ${fmt(cost.amount)}`;
    if (cost.calc_type === 'PERCENTAGE' && cost.reference_value) return `${cost.amount}% de ${fmt(cost.reference_value)}`;
    return null;
  };

  const inp = "w-full h-10 px-3 text-sm bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors";

  // ─── Categories sub-view ────────────────────
  if (subView === 'categories') {
    return (
      <CategoriesView
        categories={dbCategories}
        onBack={() => { setSubView('costs'); loadCategories(); }}
        onRefresh={loadCategories}
      />
    );
  }

  // ─── Costs main view ───────────────────────
  if (loading) return <p className="text-[13px] text-neutral-400 py-20 text-center">Carregando...</p>;

  const dueDayNum = formData.due_day ? parseInt(formData.due_day) : null;

  return (
    <div>
      <SectionHeader
        title="Custos"
        rightSlot={
          <div className="flex items-center gap-2">
            <button onClick={() => setSubView('categories')} className="inline-flex items-center gap-1.5 h-9 px-3 text-[13px] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors" title="Gerenciar categorias">
              <Settings className="w-4 h-4" /> <span className="hidden sm:inline">Categorias</span>
            </button>
            <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="h-9 px-3 text-sm bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors" />
            <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="inline-flex items-center gap-1.5 h-9 px-3 text-[13px] font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </div>
        }
      />

      {/* No categories warning */}
      {dbCategories.length === 0 && !showForm && (
        <div className="mb-6 py-4 px-5 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-neutral-50 dark:bg-neutral-900/50">
          <p className="text-[13px] text-neutral-600 dark:text-neutral-400">
            Crie categorias para organizar seus custos.{' '}
            <button onClick={() => setSubView('categories')} className="text-neutral-900 dark:text-white font-medium hover:underline">Gerenciar categorias</button>
          </p>
        </div>
      )}

      {/* Form — inline for new, modal for edit */}
      {showForm && !editingId && (
        <div className="mb-8 border border-neutral-200 dark:border-neutral-800 rounded-lg p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-medium text-neutral-900 dark:text-white">Novo custo</h3>
            <button onClick={resetForm} className="text-neutral-400 hover:text-neutral-600 transition-colors"><X className="w-4 h-4" /></button>
          </div>

          {dbCategories.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-[13px] text-neutral-500 mb-3">Crie pelo menos uma categoria antes de adicionar custos.</p>
              <button onClick={() => setSubView('categories')} className="h-9 px-4 text-[13px] font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
                Criar categoria
              </button>
            </div>
          ) : (
            <CostForm formData={formData} setFormData={setFormData} dbCategories={dbCategories} showDayPicker={showDayPicker} setShowDayPicker={setShowDayPicker} dueDayNum={dueDayNum} computePreview={computePreview} handleSubmit={handleSubmit} resetForm={resetForm} editingId={editingId} inp={inp} />
          )}
        </div>
      )}

      {/* Edit modal */}
      {showForm && editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={resetForm} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-neutral-925 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-medium text-neutral-900 dark:text-white">Editar custo</h3>
              <button onClick={resetForm} className="text-neutral-400 hover:text-neutral-600 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <CostForm formData={formData} setFormData={setFormData} dbCategories={dbCategories} showDayPicker={showDayPicker} setShowDayPicker={setShowDayPicker} dueDayNum={dueDayNum} computePreview={computePreview} handleSubmit={handleSubmit} resetForm={resetForm} editingId={editingId} inp={inp} />
          </div>
        </div>
      )}

      {/* Total summary */}
      {costs.length > 0 && (
        <div className="flex items-center justify-between mb-6 py-3 border-y border-neutral-200 dark:border-neutral-800">
          <span className="text-[11px] uppercase tracking-wider text-neutral-400">Total de custos no mês</span>
          <span className="text-base font-semibold font-mono tabular-nums text-neutral-900 dark:text-white">{fmt(totalCosts)}</span>
        </div>
      )}

      {/* Grouped costs */}
      {costs.length === 0 ? (
        <p className="text-[13px] text-neutral-400 dark:text-neutral-600 py-12 text-center">Nenhum custo cadastrado para este mês.</p>
      ) : (
        Object.keys(grouped).sort().map(catName => {
          const group = grouped[catName];
          return (
            <div key={catName} className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: group.color }} />
                  <h3 className="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">{catName}</h3>
                </div>
                <span className="text-[11px] font-mono tabular-nums text-neutral-400">{fmt(categoryTotals[catName] || 0)}</span>
              </div>

              {/* Desktop: table */}
              <div className="hidden sm:block border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800">
                      <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-neutral-400 dark:text-neutral-500">Nome</th>
                      <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-neutral-400 dark:text-neutral-500">Tipo</th>
                      <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-neutral-400 dark:text-neutral-500">Cálculo</th>
                      <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium text-neutral-400 dark:text-neutral-500">Total</th>
                      <th className="w-20 px-4 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.costs.map(cost => {
                      const detail = calcDetail(cost);
                      return (
                        <tr key={cost.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 group">
                          <td className="px-4 py-3">
                            <p className="text-[13px] text-neutral-900 dark:text-white">{cost.name}</p>
                            {cost.description && <p className="text-[11px] text-neutral-400 mt-0.5">{cost.description}</p>}
                            {cost.due_day && <p className="text-[11px] text-neutral-400 mt-0.5">Venc. dia {String(cost.due_day).padStart(2, '0')}</p>}
                          </td>
                          <td className="px-4 py-3 text-[11px] text-neutral-500">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${cost.recurrence === 'MONTHLY' ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400' : 'bg-neutral-50 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-500'}`}>
                              {cost.recurrence === 'MONTHLY' ? 'Mensal' : 'Pontual'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-[12px] font-mono tabular-nums text-neutral-400">
                            {detail || CALC_LABELS[cost.calc_type]}
                          </td>
                          <td className="px-4 py-3 text-right text-[13px] font-mono tabular-nums text-neutral-900 dark:text-white">{fmt(cost.total)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEdit(cost)} className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDelete(cost.id)} className="p-1.5 text-neutral-400 hover:text-negative transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile: cards */}
              <div className="sm:hidden space-y-2">
                {group.costs.map(cost => {
                  const detail = calcDetail(cost);
                  return (
                    <div key={cost.id} className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-neutral-900 dark:text-white truncate">{cost.name}</p>
                          {cost.description && <p className="text-[11px] text-neutral-400 mt-0.5 truncate">{cost.description}</p>}
                        </div>
                        <span className="text-[14px] font-mono tabular-nums font-semibold text-neutral-900 dark:text-white flex-shrink-0">{fmt(cost.total)}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2.5">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${cost.recurrence === 'MONTHLY' ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400' : 'bg-neutral-50 dark:bg-neutral-900 text-neutral-500'}`}>
                          {cost.recurrence === 'MONTHLY' ? 'Mensal' : 'Pontual'}
                        </span>
                        {cost.due_day && <span className="text-[11px] text-neutral-400">Venc. dia {String(cost.due_day).padStart(2, '0')}</span>}
                        {detail && <span className="text-[11px] font-mono text-neutral-400">{detail}</span>}
                      </div>
                      <div className="flex items-center justify-end gap-1 mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800/50">
                        <button onClick={() => handleEdit(cost)} className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(cost.id)} className="p-1.5 text-neutral-400 hover:text-negative transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function mapCost(i: any): Cost {
  return {
    id: String(i.id),
    name: String(i.name),
    description: i.description || null,
    category: String(i.category || ''),
    category_id: i.category_id || null,
    categoryRef: i.categoryRef || null,
    recurrence: i.recurrence as Recurrence,
    month: i.month ? String(i.month).slice(0, 7) : null,
    due_day: i.due_day ?? null,
    calc_type: (i.calc_type || 'FIXED') as CalcType,
    amount: Number(i.amount ?? 0),
    quantity: i.quantity ?? null,
    reference_value: i.reference_value ? Number(i.reference_value) : null,
    total: Number(i.total ?? 0),
    is_active: i.is_active !== false,
  };
}
