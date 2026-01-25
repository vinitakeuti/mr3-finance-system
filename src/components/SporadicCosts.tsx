 'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { SectionHeader } from './SectionHeader';

type SporadicCost = {
  id: string;
  name: string;
  description?: string;
  amount: number;
  date: string;
  category: string;
};

const createId = () => Math.random().toString(36).slice(2);

export function SporadicCosts() {
  const [costs, setCosts] = useState<SporadicCost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    date: '',
    category: 'geral',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const costData: Omit<SporadicCost, 'id'> = {
      name: formData.name,
      description: formData.description || '',
      amount: parseFloat(formData.amount),
      date: formData.date,
      category: formData.category,
    };

    if (editingId) {
      setCosts(prev =>
        prev.map(cost => (cost.id === editingId ? { ...cost, ...costData } : cost)),
      );
      resetForm();
    } else {
      setCosts(prev => [
        ...prev,
        {
          id: createId(),
          ...costData,
        },
      ]);
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este custo?')) return;
    setCosts(prev => prev.filter(cost => cost.id !== id));
  };

  const handleEdit = (cost: SporadicCost) => {
    setEditingId(cost.id);
    setFormData({
      name: cost.name,
      description: cost.description || '',
      amount: cost.amount.toString(),
      date: cost.date,
      category: cost.category,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      amount: '',
      date: '',
      category: 'geral',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const totalCosts = costs.reduce((sum, cost) => sum + Number(cost.amount), 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Custos Esporádicos"
        rightSlot={
          <div className="flex gap-3">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-black dark:border-white bg-transparent text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </button>
          </div>
        }
      />

      {showForm && (
        <div className="border border-black dark:border-white p-6">
          <h3 className="text-xl font-bold text-black dark:text-white mb-4">
            {editingId ? 'Editar Custo' : 'Novo Custo Esporádico'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-black dark:border-white bg-transparent text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  placeholder="Ex: API de Teste"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Categoria *
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-black dark:border-white bg-transparent text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  placeholder="Ex: teste, api, outros"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Valor (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-black dark:border-white bg-transparent text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  placeholder="0,00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Data *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-black dark:border-white bg-transparent text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-black dark:border-white bg-transparent text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                placeholder="Detalhes adicionais"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                {editingId ? 'Atualizar' : 'Salvar'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-black dark:border-white text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {costs.length > 0 && (
        <div className="border border-black dark:border-white p-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium text-black dark:text-white">Total do Mês</span>
            <span className="text-2xl font-bold text-black dark:text-white">{formatCurrency(totalCosts)}</span>
          </div>
        </div>
      )}

      <div className="border border-black dark:border-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black dark:border-white">
                <th className="text-left p-4 text-sm font-medium text-black dark:text-white">Data</th>
                <th className="text-left p-4 text-sm font-medium text-black dark:text-white">Nome</th>
                <th className="text-left p-4 text-sm font-medium text-black dark:text-white">Categoria</th>
                <th className="text-left p-4 text-sm font-medium text-black dark:text-white">Valor</th>
                <th className="text-center p-4 text-sm font-medium text-black dark:text-white">Ações</th>
              </tr>
            </thead>
            <tbody>
              {costs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-gray-600 dark:text-gray-400">
                    Nenhum custo esporádico cadastrado para este mês
                  </td>
                </tr>
              ) : (
                costs.map((cost) => (
                  <tr key={cost.id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="p-4 text-gray-700 dark:text-gray-300">{formatDate(cost.date)}</td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-black dark:text-white">{cost.name}</p>
                        {cost.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{cost.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-gray-700 dark:text-gray-300">{cost.category}</td>
                    <td className="p-4 font-medium text-black dark:text-white">{formatCurrency(Number(cost.amount))}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(cost)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-black dark:text-white" />
                        </button>
                        <button
                          onClick={() => handleDelete(cost.id)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
