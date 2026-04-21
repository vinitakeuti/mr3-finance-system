'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, X, Copy, ExternalLink, ArrowLeft, Settings, Search, Check } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { ColorPicker } from './ColorPicker';

type SubView = 'items' | 'categories';

interface VaultCategory {
  id: string;
  name: string;
  color: string;
  _count: { items: number };
}

interface VaultItem {
  id: string;
  name: string;
  content: string;
  link: string | null;
  category_id: string | null;
  categoryRef: { id: string; name: string; color: string } | null;
}

const inp = "w-full h-10 px-3 text-sm bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors";

// ─── Copy button helper ──────────────────────────────────────

function CopyBtn({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handle} className={`p-1.5 transition-colors ${copied ? 'text-positive' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'} ${className}`} title="Copiar">
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ─── Category Management ─────────────────────────────────────

function CategoriesView({ categories, onBack, onRefresh }: {
  categories: VaultCategory[];
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('#737373');
  const [showForm, setShowForm] = useState(false);

  const resetForm = () => { setFormName(''); setFormColor('#737373'); setEditingId(null); setShowForm(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    try {
      const url = editingId ? `/api/vault-categories/${editingId}` : '/api/vault-categories';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: formName.trim(), color: formColor }) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.error || 'Erro'); }
      resetForm();
      onRefresh();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (cat: VaultCategory) => {
    if (!confirm(cat._count.items > 0 ? `"${cat.name}" tem ${cat._count.items} item(ns) que serão desvinculados. Continuar?` : `Excluir "${cat.name}"?`)) return;
    try {
      const res = await fetch(`/api/vault-categories/${cat.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir');
      onRefresh();
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors">
          <ArrowLeft className="w-[18px] h-[18px]" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">Categorias do Cofre</h2>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="inline-flex items-center gap-1.5 h-9 px-3 text-[13px] font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
          <Plus className="w-4 h-4" /> Nova
        </button>
      </div>

      {showForm && (
        <div className="mb-6 border border-neutral-200 dark:border-neutral-800 rounded-lg p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Nome</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} required className={inp} placeholder="Ex: Ferramentas, Contratos..." />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Cor</label>
                <div className="pt-1.5">
                  <ColorPicker value={formColor} onChange={setFormColor} />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="h-9 px-4 text-[13px] font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">{editingId ? 'Atualizar' : 'Criar'}</button>
              <button type="button" onClick={resetForm} className="h-9 px-4 text-[13px] text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {categories.length === 0 ? (
        <p className="text-[13px] text-neutral-400 dark:text-neutral-600 py-16 text-center">Nenhuma categoria criada.</p>
      ) : (
        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between px-4 py-3 border border-neutral-200 dark:border-neutral-800 rounded-lg group">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="text-[13px] text-neutral-900 dark:text-white font-medium">{cat.name}</span>
                <span className="text-[11px] text-neutral-400">{cat._count.items}</span>
              </div>
              <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingId(cat.id); setFormName(cat.name); setFormColor(cat.color); setShowForm(true); }} className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(cat)} className="p-1.5 text-neutral-400 hover:text-negative transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Item View Modal ─────────────────────────────────────────

function ItemViewModal({ item, onClose, onEdit, onDelete }: {
  item: VaultItem;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white dark:bg-neutral-925 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white dark:bg-neutral-925 border-b border-neutral-100 dark:border-neutral-800/50">
          <div className="flex items-center gap-2.5 min-w-0">
            {item.categoryRef && <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.categoryRef.color }} />}
            <h3 className="text-[15px] font-semibold text-neutral-900 dark:text-white truncate">{item.name}</h3>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 ml-3">
            <button onClick={onEdit} className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"><Edit2 className="w-4 h-4" /></button>
            <button onClick={onDelete} className="p-1.5 text-neutral-400 hover:text-negative transition-colors"><Trash2 className="w-4 h-4" /></button>
            <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-neutral-600 transition-colors ml-1"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {item.content && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Conteúdo</span>
                <CopyBtn text={item.content} />
              </div>
              <div className="text-[13px] text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap break-words bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-4 border border-neutral-100 dark:border-neutral-800/50">
                {item.content}
              </div>
            </div>
          )}

          {item.link && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Link</span>
                <div className="flex items-center gap-0.5">
                  <CopyBtn text={item.link} />
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors" title="Abrir link">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
              <a href={item.link} target="_blank" rel="noopener noreferrer"
                className="block text-[13px] text-neutral-800 dark:text-neutral-200 hover:underline bg-neutral-50 dark:bg-neutral-900/50 rounded-lg px-4 py-3 border border-neutral-100 dark:border-neutral-800/50 truncate">
                {item.link}
              </a>
            </div>
          )}

          {!item.content && !item.link && (
            <p className="text-[13px] text-neutral-400 text-center py-6">Nenhum conteúdo adicionado.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Item Form Modal ─────────────────────────────────────────

function ItemFormModal({ item, categories, onClose, onSaved }: {
  item: VaultItem | null;
  categories: VaultCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(item?.name || '');
  const [content, setContent] = useState(item?.content || '');
  const [link, setLink] = useState(item?.link || '');
  const [categoryId, setCategoryId] = useState(item?.category_id || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const payload = { name: name.trim(), content, link: link || null, category_id: categoryId || null };
      const url = item ? `/api/vault/${item.id}` : '/api/vault';
      const method = item ? 'PATCH' : 'POST';
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
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white dark:bg-neutral-925 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[15px] font-medium text-neutral-900 dark:text-white">{item ? 'Editar' : 'Novo item'}</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Título</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required className={inp} placeholder="Ex: Login servidor, Contrato cliente X" />
          </div>

          {categories.length > 0 && (
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Categoria</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button key={cat.id} type="button" onClick={() => setCategoryId(prev => prev === cat.id ? '' : cat.id)}
                    className={`inline-flex items-center gap-1.5 h-8 px-3 text-[12px] rounded-lg border transition-all ${categoryId === cat.id ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium' : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-600'}`}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: categoryId === cat.id ? 'currentColor' : cat.color }} />
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Conteúdo</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={8}
              className={`${inp} h-auto py-3 leading-relaxed`}
              placeholder="Escreva aqui... credenciais, anotações, instruções, etc."
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Link</label>
            <input type="url" value={link} onChange={e => setLink(e.target.value)} className={inp} placeholder="https://..." />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={submitting} className="h-9 px-4 text-[13px] font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-40">
              {submitting ? 'Salvando...' : item ? 'Atualizar' : 'Salvar'}
            </button>
            <button type="button" onClick={onClose} className="h-9 px-4 text-[13px] text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Vault ──────────────────────────────────────────────

export function Vault() {
  const [subView, setSubView] = useState<SubView>('items');
  const [items, setItems] = useState<VaultItem[]>([]);
  const [categories, setCategories] = useState<VaultCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // undefined = closed, null = new item, VaultItem = edit
  const [formModal, setFormModal] = useState<VaultItem | null | undefined>(undefined);
  const [viewItem, setViewItem] = useState<VaultItem | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/vault-categories');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setCategories(data);
    } catch (e) { console.error(e); }
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vault');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setItems(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);
  useEffect(() => { loadItems(); }, [loadItems]);

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este item?')) return;
    try {
      const res = await fetch(`/api/vault/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir');
      setItems(prev => prev.filter(i => i.id !== id));
      setViewItem(null);
      loadCategories();
    } catch (err: any) { alert(err.message); }
  };

  // Group items by category
  const grouped = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = search
      ? items.filter(i => i.name.toLowerCase().includes(q) || i.content.toLowerCase().includes(q))
      : items;

    const groups: { category: VaultCategory | null; items: VaultItem[] }[] = [];
    const catMap = new Map<string, VaultItem[]>();
    const uncategorized: VaultItem[] = [];

    for (const item of filtered) {
      if (item.category_id) {
        if (!catMap.has(item.category_id)) catMap.set(item.category_id, []);
        catMap.get(item.category_id)!.push(item);
      } else {
        uncategorized.push(item);
      }
    }

    // Ordered by category sort_order
    for (const cat of categories) {
      const catItems = catMap.get(cat.id);
      if (catItems && catItems.length > 0) {
        groups.push({ category: cat, items: catItems });
      }
    }

    if (uncategorized.length > 0) {
      groups.push({ category: null, items: uncategorized });
    }

    return groups;
  }, [items, categories, search]);

  const totalItems = useMemo(() => grouped.reduce((s, g) => s + g.items.length, 0), [grouped]);

  if (subView === 'categories') {
    return (
      <CategoriesView
        categories={categories}
        onBack={() => { setSubView('items'); loadCategories(); }}
        onRefresh={loadCategories}
      />
    );
  }

  return (
    <div>
      <SectionHeader
        title="Cofre"
        rightSlot={
          <div className="flex items-center gap-2">
            <button onClick={() => setSubView('categories')} className="inline-flex items-center gap-1.5 h-9 px-3 text-[13px] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
              <Settings className="w-4 h-4" /> <span className="hidden sm:inline">Categorias</span>
            </button>
            <button onClick={() => setFormModal(null)} className="inline-flex items-center gap-1.5 h-9 px-3 text-[13px] font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Novo</span>
            </button>
          </div>
        }
      />

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar no cofre..."
          className="w-full h-10 pl-10 pr-3 text-sm bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
        />
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-[13px] text-neutral-400 py-20 text-center">Carregando...</p>
      ) : totalItems === 0 ? (
        <div className="text-center py-16">
          <p className="text-[13px] text-neutral-400 dark:text-neutral-600 mb-2">
            {search ? 'Nenhum resultado.' : 'Cofre vazio.'}
          </p>
          {!search && <p className="text-[12px] text-neutral-400 dark:text-neutral-600">Adicione credenciais, links e documentos.</p>}
        </div>
      ) : (
        <div className="space-y-10">
          {grouped.map((group, gi) => (
            <div key={group.category?.id || 'uncategorized'}>
              {/* Section header */}
              <div className="flex items-center gap-3 mb-4">
                {group.category ? (
                  <>
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: group.category.color }} />
                    <h3 className="text-[14px] font-semibold text-neutral-900 dark:text-white">{group.category.name}</h3>
                    <span className="text-[11px] text-neutral-400">{group.items.length}</span>
                  </>
                ) : (
                  <>
                    <h3 className="text-[14px] font-semibold text-neutral-900 dark:text-white">Sem categoria</h3>
                    <span className="text-[11px] text-neutral-400">{group.items.length}</span>
                  </>
                )}
                <div className="flex-1 border-t border-neutral-150 dark:border-neutral-800 ml-2" />
              </div>

              {/* Cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setViewItem(item)}
                    className="text-left border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-all group/card cursor-pointer"
                  >
                    <h4 className="text-[13px] font-medium text-neutral-900 dark:text-white mb-1.5 truncate">{item.name}</h4>
                    {item.content && (
                      <p className="text-[12px] text-neutral-400 dark:text-neutral-500 line-clamp-2 leading-relaxed">{item.content}</p>
                    )}
                    {item.link && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <ExternalLink className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                        <span className="text-[11px] text-neutral-400 truncate">{item.link}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View modal */}
      {viewItem && (
        <ItemViewModal
          item={viewItem}
          onClose={() => setViewItem(null)}
          onEdit={() => { setViewItem(null); setFormModal(viewItem); }}
          onDelete={() => handleDelete(viewItem.id)}
        />
      )}

      {/* Form modal */}
      {formModal !== undefined && (
        <ItemFormModal
          item={formModal}
          categories={categories}
          onClose={() => setFormModal(undefined)}
          onSaved={() => { loadItems(); loadCategories(); }}
        />
      )}
    </div>
  );
}
