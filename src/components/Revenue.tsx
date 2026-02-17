'use client';

import { useEffect, useState } from 'react';
import { Save, TrendingUp } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import jsPDF from 'jspdf';

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

  // Carrega dados do mês selecionado
  useEffect(() => {
    const loadCurrent = async () => {
      try {
        const res = await fetch(`/api/revenue?month=${encodeURIComponent(selectedMonth)}`);
        if (!res.ok) return;
        const data = await res.json();

        if (!data) {
          setExistingId(null);
          setFormData({
            total_revenue: '',
            sales_count: '',
            traffic_investment: '',
          });
          return;
        }

        setExistingId(data.id ?? null);
        setFormData({
          total_revenue: String(data.total_revenue ?? ''),
          sales_count: String(data.sales_count ?? ''),
          traffic_investment: String(data.traffic_investment ?? ''),
        });
      } catch (error) {
        console.error('Erro ao carregar faturamento do mês', error);
      }
    };

    loadCurrent();
  }, [selectedMonth]);

  // Carrega histórico (últimos meses)
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch('/api/revenue');
        if (!res.ok) return;
        const data = await res.json();

        if (!Array.isArray(data)) {
          setRevenueHistory([]);
          return;
        }

        const mapped: RevenueEntry[] = data.map((item: any) => ({
          id: String(item.month),
          month: String(item.month),
          total_revenue: Number(item.total_revenue ?? 0),
          sales_count: Number(item.sales_count ?? 0),
          traffic_investment: Number(item.traffic_investment ?? 0),
        }));

        setRevenueHistory(mapped);
      } catch (error) {
        console.error('Erro ao carregar histórico de faturamento', error);
      }
    };

    loadHistory();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      month: selectedMonth,
      total_revenue: parseFloat(formData.total_revenue) || 0,
      sales_count: parseInt(formData.sales_count) || 0,
      traffic_investment: parseFloat(formData.traffic_investment) || 0,
    };

    try {
      const res = await fetch('/api/revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.error || 'Erro ao salvar faturamento');
      }

      const saved = await res.json();
      setExistingId(saved.id ?? null);

      // Atualiza histórico após salvar
      try {
        const histRes = await fetch('/api/revenue');
        if (histRes.ok) {
          const data = await histRes.json();
          if (Array.isArray(data)) {
            const mapped: RevenueEntry[] = data.map((item: any) => ({
              id: String(item.month),
              month: String(item.month),
              total_revenue: Number(item.total_revenue ?? 0),
              sales_count: Number(item.sales_count ?? 0),
              traffic_investment: Number(item.traffic_investment ?? 0),
            }));
            setRevenueHistory(mapped);
          }
        }
      } catch (err) {
        console.error('Erro ao atualizar histórico após salvar faturamento', err);
      }

      alert('Faturamento salvo com sucesso!');
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Erro ao salvar faturamento.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatMonth = (monthString: string) => {
    return new Date(monthString).toLocaleDateString('pt-BR', {
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

  const calculateMargin = () => {
    const revenue = parseFloat(formData.total_revenue) || 0;
    const investment = parseFloat(formData.traffic_investment) || 0;
    if (revenue <= 0) return 0;
    const lucro = revenue - investment;
    return (lucro / revenue) * 100;
  };

  const handleGeneratePdf = () => {
    const doc = new jsPDF();

    const revenue = parseFloat(formData.total_revenue) || 0;
    const investment = parseFloat(formData.traffic_investment) || 0;
    const gross = calculateGrossProfit();
    const margin = calculateMargin();
    const ticket = calculateTicketMedio();

    doc.setFontSize(18);
    doc.text('Resumo Financeiro', 20, 20);

    doc.setFontSize(12);
    doc.text(`Mês: ${selectedMonth || '-'}`, 20, 32);
    doc.text(`Faturamento total: ${formatCurrency(revenue)}`, 20, 42);
    doc.text(`Investimento em tráfego: ${formatCurrency(investment)}`, 20, 50);
    doc.text(`Lucro bruto: ${formatCurrency(gross)}`, 20, 58);
    doc.text(`Margem de lucro: ${margin.toFixed(1)}%`, 20, 66);
    doc.text(`Ticket médio: ${formatCurrency(ticket)}`, 20, 74);

    doc.save(`resumo-${selectedMonth || 'mes'}.pdf`);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Resumo"
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
        <div className="border border-black dark:border-white p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Margem de Lucro</p>
          <p className="text-2xl font-bold text-black dark:text-white">
            {(() => {
              const margin = calculateMargin();
              return margin.toFixed(1) + '%';
            })()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            (Faturamento - Tráfego) / Faturamento
          </p>
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
          <button
            type="button"
            onClick={handleGeneratePdf}
            className="mt-4 inline-flex items-center px-6 py-2 border border-black dark:border-white text-sm font-medium text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
          >
            Gerar PDF de Resumo
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
