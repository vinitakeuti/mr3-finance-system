 'use client';

import { useState } from 'react';
import { Save, TrendingUp } from 'lucide-react';
import { SectionHeader } from './SectionHeader';

interface RevenueEntry {
  id: string;
  month: string;
  total_revenue: number;
  sales_count: number;
  traffic_investment: number;
}

const createId = () => Math.random().toString(36).slice(2);

export function Revenue() {
  const [loading, setLoading] = useState(false);
  const [revenueHistory, setRevenueHistory] = useState<RevenueEntry[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [formData, setFormData] = useState({
    total_revenue: '',
    sales_count: '',
    traffic_investment: '',
  });
  const [existingId, setExistingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const monthDate = `${selectedMonth}-01`;

    const revenueData: Omit<RevenueEntry, 'id'> = {
      month: monthDate,
      total_revenue: parseFloat(formData.total_revenue) || 0,
      sales_count: parseInt(formData.sales_count) || 0,
      traffic_investment: parseFloat(formData.traffic_investment) || 0,
    };

    if (existingId) {
      setRevenueHistory(prev =>
        prev.map(entry => (entry.id === existingId ? { ...entry, ...revenueData } : entry)),
      );
      alert('Faturamento atualizado com sucesso! (modo teste, sem banco de dados)');
    } else {
      const id = createId();
      setRevenueHistory(prev => [
        { id, ...revenueData },
        ...prev,
      ]);
      setExistingId(id);
      alert('Faturamento salvo com sucesso! (modo teste, sem banco de dados)');
    }

    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatMonth = (monthString: string) => {
    return new Date(monthString + 'T00:00:00').toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
    });
  };

  const calculateGrossProfit = () => {
    const revenue = parseFloat(formData.total_revenue) || 0;
    const investment = parseFloat(formData.traffic_investment) || 0;
    return revenue - investment;
  };

  const calculateTicketMedio = () => {
    const revenue = parseFloat(formData.total_revenue) || 0;
    const sales = parseInt(formData.sales_count) || 0;
    return sales > 0 ? revenue / sales : 0;
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Faturamento"
        rightSlot={
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Selecionar Mês
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-black dark:border-white bg-transparent text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border border-black dark:border-white p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Lucro Bruto (Estimado)</p>
          <p className="text-2xl font-bold text-black dark:text-white">{formatCurrency(calculateGrossProfit())}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Faturamento - Tráfego</p>
        </div>
        <div className="border border-black dark:border-white p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Ticket Médio</p>
          <p className="text-2xl font-bold text-black dark:text-white">{formatCurrency(calculateTicketMedio())}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Faturamento / Vendas</p>
        </div>
        <div className="border border-black dark:border-white p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">ROI de Tráfego</p>
          <p className="text-2xl font-bold text-black dark:text-white">
            {(() => {
              const revenue = parseFloat(formData.total_revenue) || 0;
              const investment = parseFloat(formData.traffic_investment) || 0;
              const roi = investment > 0 ? ((revenue - investment) / investment) * 100 : 0;
              return roi.toFixed(1) + '%';
            })()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Retorno sobre investimento</p>
        </div>
      </div>

      <div className="border border-black dark:border-white p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Faturamento Total (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.total_revenue}
                onChange={(e) => setFormData({ ...formData, total_revenue: e.target.value })}
                required
                className="w-full px-4 py-2 border border-black dark:border-white bg-transparent text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                placeholder="0,00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Quantidade de Vendas *
              </label>
              <input
                type="number"
                min="0"
                value={formData.sales_count}
                onChange={(e) => setFormData({ ...formData, sales_count: e.target.value })}
                required
                className="w-full px-4 py-2 border border-black dark:border-white bg-transparent text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Investimento em Tráfego (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.traffic_investment}
                onChange={(e) => setFormData({ ...formData, traffic_investment: e.target.value })}
                required
                className="w-full px-4 py-2 border border-black dark:border-white bg-transparent text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                placeholder="0,00"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Salvando...' : existingId ? 'Atualizar' : 'Salvar'}
          </button>
        </form>
      </div>

      {revenueHistory.length > 0 && (
        <div className="border border-black dark:border-white">
          <div className="p-6 border-b border-black dark:border-white">
            <h3 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Histórico de Faturamento
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black dark:border-white">
                  <th className="text-left p-4 text-sm font-medium text-black dark:text-white">Mês</th>
                  <th className="text-right p-4 text-sm font-medium text-black dark:text-white">Faturamento</th>
                  <th className="text-right p-4 text-sm font-medium text-black dark:text-white">Vendas</th>
                  <th className="text-right p-4 text-sm font-medium text-black dark:text-white">Investimento</th>
                  <th className="text-right p-4 text-sm font-medium text-black dark:text-white">Lucro Bruto</th>
                </tr>
              </thead>
              <tbody>
                {revenueHistory.map((item, index) => {
                  const grossProfit = item.total_revenue - item.traffic_investment;
                  return (
                    <tr
                      key={index}
                      className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      <td className="p-4 text-gray-700 dark:text-gray-300">{formatMonth(item.month)}</td>
                      <td className="p-4 text-right font-medium text-black dark:text-white">
                        {formatCurrency(item.total_revenue)}
                      </td>
                      <td className="p-4 text-right text-gray-700 dark:text-gray-300">{item.sales_count}</td>
                      <td className="p-4 text-right text-gray-700 dark:text-gray-300">
                        {formatCurrency(item.traffic_investment)}
                      </td>
                      <td className={`p-4 text-right font-medium ${grossProfit >= 0 ? 'text-black dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(grossProfit)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
