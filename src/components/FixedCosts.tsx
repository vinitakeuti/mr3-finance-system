 'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, Check } from 'lucide-react';
import { SectionHeader } from './SectionHeader';

type FixedCost = {
  id: string;
  name: string;
  description?: string;
  amount: number;
  due_day: number;
  category: string;
};

type PaymentStatus = {
  is_paid: boolean;
};

const createId = () => Math.random().toString(36).slice(2);

export function FixedCosts() {
  const [costs, setCosts] = useState<FixedCost[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, PaymentStatus>>({});
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
    due_day: '',
    category: 'ferramentas',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const costData: Omit<FixedCost, 'id'> = {
      name: formData.name,
      description: formData.description || '',
      amount: parseFloat(formData.amount),
      due_day: parseInt(formData.due_day),
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
    setPaymentStatuses(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const handleEdit = (cost: FixedCost) => {
    setEditingId(cost.id);
    setFormData({
      name: cost.name,
      description: cost.description || '',
      amount: cost.amount.toString(),
      due_day: cost.due_day.toString(),
      category: cost.category,
    });
    setShowForm(true);
  };

  const togglePayment = (costId: string) => {
    setPaymentStatuses(prev => {
      const current = prev[costId];
      return {
        ...prev,
        [costId]: {
          is_paid: !current?.is_paid,
        },
      };
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      amount: '',
      due_day: '',
      category: 'ferramentas',
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

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Custos Fixos"
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
            {editingId ? 'Editar Custo' : 'Novo Custo Fixo'}
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
                  placeholder="Ex: Hostinger"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Categoria *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                >
                  <option value="hospedagem">Hospedagem</option>
                  <option value="ferramentas">Ferramentas</option>
                  <option value="colaborador">Colaborador</option>
                  <option value="outros">Outros</option>
                </select>
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
                  Dia do Vencimento *
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.due_day}
                  onChange={(e) => setFormData({ ...formData, due_day: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-black dark:border-white bg-transparent text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  placeholder="1-31"
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

      <div className="border border-black dark:border-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black dark:border-white">
                <th className="text-left p-4 text-sm font-medium text-black dark:text-white">Nome</th>
                <th className="text-left p-4 text-sm font-medium text-black dark:text-white">Categoria</th>
                <th className="text-left p-4 text-sm font-medium text-black dark:text-white">Valor</th>
                <th className="text-left p-4 text-sm font-medium text-black dark:text-white">Vencimento</th>
                <th className="text-center p-4 text-sm font-medium text-black dark:text-white">Pago</th>
                <th className="text-center p-4 text-sm font-medium text-black dark:text-white">Ações</th>
              </tr>
            </thead>
            <tbody>
              {costs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-gray-600 dark:text-gray-400">
                    Nenhum custo fixo cadastrado
                  </td>
                </tr>
              ) : (
                costs.map((cost) => {
                  const isPaid = paymentStatuses[cost.id]?.is_paid || false;
                  return (
                    <tr key={cost.id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
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
                      <td className="p-4 text-gray-700 dark:text-gray-300">Dia {cost.due_day}</td>
                      <td className="p-4">
                        <button
                          onClick={() => togglePayment(cost.id)}
                          className={`mx-auto flex items-center justify-center w-8 h-8 border-2 transition-colors ${
                            isPaid
                              ? 'border-black dark:border-white bg-black dark:bg-white'
                              : 'border-gray-400 dark:border-gray-600 hover:border-black dark:hover:border-white'
                          }`}
                        >
                          {isPaid && <Check className="w-4 h-4 text-white dark:text-black" />}
                        </button>
                      </td>
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
