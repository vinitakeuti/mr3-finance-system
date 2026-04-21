'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, X, Trash2, Edit2, GripVertical, MoreHorizontal } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { ColorPicker } from './ColorPicker';

interface KanbanCard {
  id: string;
  title: string;
  description: string | null;
  column_id: string;
  sort_order: number;
}

interface KanbanColumn {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  cards: KanbanCard[];
}

const inp = "w-full h-10 px-3 text-sm bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors";

// ─── Column Menu ─────────────────────────────────────────────

function ColumnMenu({ column, onRename, onDelete, onClose }: {
  column: KanbanColumn;
  onRename: (name: string, color: string) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(column.name);
  const [color, setColor] = useState(column.color);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute right-0 top-full mt-1 z-50 w-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xl p-4 space-y-3">
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Nome</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} className={inp} />
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Cor</label>
        <ColorPicker value={color} onChange={setColor} />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800/50">
        <button onClick={() => { if (name.trim()) { onRename(name.trim(), color); onClose(); } }}
          className="h-8 px-3 text-[12px] font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
          Salvar
        </button>
        <button onClick={() => { onDelete(); onClose(); }}
          className="h-8 px-3 text-[12px] text-negative hover:bg-negative/10 rounded-lg transition-colors">
          Excluir etapa
        </button>
      </div>
    </div>
  );
}

// ─── Card Edit Modal ─────────────────────────────────────────

function CardModal({ card, columns, onClose, onSaved, onDelete }: {
  card: KanbanCard | null; // null = new
  columns: KanbanColumn[];
  onClose: () => void;
  onSaved: () => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState(card?.title || '');
  const [description, setDescription] = useState(card?.description || '');
  const [columnId, setColumnId] = useState(card?.column_id || columns[0]?.id || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !columnId) return;
    setSubmitting(true);
    try {
      const payload = { title: title.trim(), description: description || null, column_id: columnId };
      const url = card ? `/api/kanban/cards/${card.id}` : '/api/kanban/cards';
      const method = card ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.error || 'Erro'); }
      onSaved();
      onClose();
    } catch (err: any) { alert(err.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-925 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[15px] font-medium text-neutral-900 dark:text-white">{card ? 'Editar tarefa' : 'Nova tarefa'}</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Título</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className={inp} placeholder="O que precisa ser feito?" autoFocus />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Descrição</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className={`${inp} h-auto py-3`} placeholder="Detalhes, contexto, links..." />
          </div>
          {card && (
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Etapa</label>
              <div className="flex flex-wrap gap-2">
                {columns.map(col => (
                  <button key={col.id} type="button" onClick={() => setColumnId(col.id)}
                    className={`inline-flex items-center gap-1.5 h-8 px-3 text-[12px] rounded-lg border transition-all ${columnId === col.id ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium' : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-600'}`}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: columnId === col.id ? 'currentColor' : col.color }} />
                    {col.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-2">
              <button type="submit" disabled={submitting} className="h-9 px-4 text-[13px] font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-40">
                {submitting ? 'Salvando...' : card ? 'Atualizar' : 'Criar'}
              </button>
              <button type="button" onClick={onClose} className="h-9 px-4 text-[13px] text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">Cancelar</button>
            </div>
            {card && onDelete && (
              <button type="button" onClick={onDelete} className="p-2 text-neutral-400 hover:text-negative transition-colors"><Trash2 className="w-4 h-4" /></button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Kanban ─────────────────────────────────────────────

export function Kanban() {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(true);

  // New column inline
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColColor, setNewColColor] = useState('#737373');

  // Quick-add card per column
  const [addingCardCol, setAddingCardCol] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');

  // Column menu
  const [menuColId, setMenuColId] = useState<string | null>(null);

  // Card modal
  const [cardModal, setCardModal] = useState<{ card: KanbanCard | null; columnId: string } | undefined>(undefined);

  // Drag state
  const dragCard = useRef<{ cardId: string; fromColId: string } | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/kanban/columns');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setColumns(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Column CRUD ──

  const addColumn = async () => {
    if (!newColName.trim()) return;
    try {
      const res = await fetch('/api/kanban/columns', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newColName.trim(), color: newColColor }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.error || 'Erro'); }
      setNewColName('');
      setNewColColor('#737373');
      setAddingColumn(false);
      load();
    } catch (err: any) { alert(err.message); }
  };

  const renameColumn = async (id: string, name: string, color: string) => {
    try {
      const res = await fetch(`/api/kanban/columns/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.error || 'Erro'); }
      load();
    } catch (err: any) { alert(err.message); }
  };

  const deleteColumn = async (id: string) => {
    const col = columns.find(c => c.id === id);
    if (!col) return;
    const msg = col.cards.length > 0 ? `"${col.name}" tem ${col.cards.length} tarefa(s) que serão excluídas. Continuar?` : `Excluir "${col.name}"?`;
    if (!confirm(msg)) return;
    try {
      await fetch(`/api/kanban/columns/${id}`, { method: 'DELETE' });
      load();
    } catch (err: any) { alert(err.message); }
  };

  // ── Card CRUD ──

  const quickAddCard = async (columnId: string) => {
    if (!newCardTitle.trim()) return;
    try {
      const res = await fetch('/api/kanban/cards', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newCardTitle.trim(), column_id: columnId }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.error || 'Erro'); }
      setNewCardTitle('');
      setAddingCardCol(null);
      load();
    } catch (err: any) { alert(err.message); }
  };

  const deleteCard = async (id: string) => {
    if (!confirm('Excluir esta tarefa?')) return;
    try {
      await fetch(`/api/kanban/cards/${id}`, { method: 'DELETE' });
      setCardModal(undefined);
      load();
    } catch (err: any) { alert(err.message); }
  };

  // ── Drag & Drop ──

  const handleDragStart = (cardId: string, fromColId: string) => {
    dragCard.current = { cardId, fromColId };
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(colId);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = async (e: React.DragEvent, toColId: string) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!dragCard.current) return;
    const { cardId, fromColId } = dragCard.current;
    dragCard.current = null;

    if (fromColId === toColId) return;

    // Optimistic update
    setColumns(prev => prev.map(col => {
      if (col.id === fromColId) return { ...col, cards: col.cards.filter(c => c.id !== cardId) };
      if (col.id === toColId) {
        const card = prev.find(c => c.id === fromColId)?.cards.find(c => c.id === cardId);
        if (!card) return col;
        return { ...col, cards: [...col.cards, { ...card, column_id: toColId }] };
      }
      return col;
    }));

    // Persist
    try {
      const maxOrder = columns.find(c => c.id === toColId)?.cards.length || 0;
      await fetch(`/api/kanban/cards/${cardId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column_id: toColId, sort_order: maxOrder }),
      });
    } catch {
      load(); // rollback
    }
  };

  // ── Touch drag for mobile ──
  const touchCard = useRef<{ el: HTMLElement; cardId: string; fromColId: string; ghost: HTMLElement | null } | null>(null);

  const handleTouchStart = (e: React.TouchEvent, cardId: string, fromColId: string) => {
    const el = e.currentTarget as HTMLElement;
    const touch = e.touches[0];

    // Create ghost
    const ghost = el.cloneNode(true) as HTMLElement;
    ghost.style.position = 'fixed';
    ghost.style.width = el.offsetWidth + 'px';
    ghost.style.left = touch.clientX - el.offsetWidth / 2 + 'px';
    ghost.style.top = touch.clientY - 20 + 'px';
    ghost.style.opacity = '0.85';
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '999';
    ghost.style.transform = 'rotate(2deg)';
    document.body.appendChild(ghost);

    el.style.opacity = '0.3';
    touchCard.current = { el, cardId, fromColId, ghost };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchCard.current?.ghost) return;
    const touch = e.touches[0];
    touchCard.current.ghost.style.left = touch.clientX - touchCard.current.ghost.offsetWidth / 2 + 'px';
    touchCard.current.ghost.style.top = touch.clientY - 20 + 'px';

    // Detect column under touch
    const elUnder = document.elementFromPoint(touch.clientX, touch.clientY);
    const colEl = elUnder?.closest('[data-col-id]');
    const colId = colEl?.getAttribute('data-col-id') || null;
    setDragOverCol(colId);
  };

  const handleTouchEnd = async () => {
    if (!touchCard.current) return;
    const { el, cardId, fromColId, ghost } = touchCard.current;
    el.style.opacity = '1';
    if (ghost) ghost.remove();
    touchCard.current = null;

    const toColId = dragOverCol;
    setDragOverCol(null);

    if (!toColId || toColId === fromColId) return;

    // Same logic as handleDrop
    setColumns(prev => prev.map(col => {
      if (col.id === fromColId) return { ...col, cards: col.cards.filter(c => c.id !== cardId) };
      if (col.id === toColId) {
        const card = prev.find(c => c.id === fromColId)?.cards.find(c => c.id === cardId);
        if (!card) return col;
        return { ...col, cards: [...col.cards, { ...card, column_id: toColId }] };
      }
      return col;
    }));

    try {
      const maxOrder = columns.find(c => c.id === toColId)?.cards.length || 0;
      await fetch(`/api/kanban/cards/${cardId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column_id: toColId, sort_order: maxOrder }),
      });
    } catch { load(); }
  };

  if (loading) return <p className="text-[13px] text-neutral-400 py-20 text-center">Carregando...</p>;

  return (
    <div>
      <SectionHeader title="Tarefas" />

      {/* Board — horizontal scroll */}
      <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6 pb-4">
        <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
          {columns.map(col => (
            <div
              key={col.id}
              data-col-id={col.id}
              onDragOver={e => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, col.id)}
              className={`w-72 flex-shrink-0 flex flex-col rounded-xl transition-colors ${
                dragOverCol === col.id
                  ? 'bg-neutral-100 dark:bg-neutral-800/50 ring-2 ring-neutral-300 dark:ring-neutral-600'
                  : 'bg-neutral-50 dark:bg-neutral-900/40'
              }`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-3 py-3 relative">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: col.color }} />
                  <h3 className="text-[13px] font-semibold text-neutral-900 dark:text-white truncate">{col.name}</h3>
                  <span className="text-[11px] text-neutral-400 font-mono">{col.cards.length}</span>
                </div>
                <button onClick={() => setMenuColId(menuColId === col.id ? null : col.id)}
                  className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {menuColId === col.id && (
                  <ColumnMenu
                    column={col}
                    onRename={(name, color) => renameColumn(col.id, name, color)}
                    onDelete={() => deleteColumn(col.id)}
                    onClose={() => setMenuColId(null)}
                  />
                )}
              </div>

              {/* Cards */}
              <div className="flex-1 px-2 pb-2 space-y-2 min-h-[80px]">
                {col.cards.map(card => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={() => handleDragStart(card.id, col.id)}
                    onTouchStart={e => handleTouchStart(e, card.id, col.id)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onClick={() => setCardModal({ card, columnId: col.id })}
                    className="bg-white dark:bg-neutral-925 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group/card touch-none"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-700 mt-0.5 flex-shrink-0 opacity-0 group-hover/card:opacity-100 transition-opacity" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] text-neutral-900 dark:text-white font-medium leading-snug">{card.title}</p>
                        {card.description && (
                          <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed">{card.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Quick add */}
                {addingCardCol === col.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newCardTitle}
                      onChange={e => setNewCardTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') quickAddCard(col.id); if (e.key === 'Escape') { setAddingCardCol(null); setNewCardTitle(''); } }}
                      className="w-full h-9 px-3 text-[13px] bg-white dark:bg-neutral-925 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
                      placeholder="Título da tarefa"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button onClick={() => quickAddCard(col.id)} className="h-7 px-3 text-[12px] font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-md hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">Criar</button>
                      <button onClick={() => { setAddingCardCol(null); setNewCardTitle(''); }} className="h-7 px-2 text-neutral-400 hover:text-neutral-600 transition-colors"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAddingCardCol(col.id); setNewCardTitle(''); }}
                    className="w-full flex items-center gap-1.5 px-3 py-2 text-[12px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-white dark:hover:bg-neutral-900 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Add column */}
          {addingColumn ? (
            <div className="w-72 flex-shrink-0 bg-neutral-50 dark:bg-neutral-900/40 rounded-xl p-3 space-y-3">
              <input
                type="text"
                value={newColName}
                onChange={e => setNewColName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addColumn(); if (e.key === 'Escape') setAddingColumn(false); }}
                className="w-full h-9 px-3 text-[13px] bg-white dark:bg-neutral-925 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600"
                placeholder="Nome da etapa"
                autoFocus
              />
              <ColorPicker value={newColColor} onChange={setNewColColor} />
              <div className="flex gap-2">
                <button onClick={addColumn} className="h-8 px-3 text-[12px] font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">Criar</button>
                <button onClick={() => setAddingColumn(false)} className="h-8 px-2 text-neutral-400 hover:text-neutral-600 transition-colors"><X className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingColumn(true)}
              className="w-72 flex-shrink-0 h-12 flex items-center justify-center gap-2 text-[13px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 bg-neutral-50/50 dark:bg-neutral-900/20 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Nova etapa
            </button>
          )}
        </div>
      </div>

      {/* Card modal */}
      {cardModal !== undefined && (
        <CardModal
          card={cardModal.card}
          columns={columns}
          onClose={() => setCardModal(undefined)}
          onSaved={load}
          onDelete={cardModal.card ? () => deleteCard(cardModal.card!.id) : undefined}
        />
      )}
    </div>
  );
}
