 'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react';
import { SectionHeader } from './SectionHeader';

interface FinancialMetrics {
  totalRevenue: number;
  totalFixedCosts: number;
  totalVariableCosts: number;
  totalSporadicCosts: number;
  grossProfit: number;
  netProfit: number;
  profitPerPartner: number;
  unpaidFixedCosts: number;
}

export function Dashboard() {
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalRevenue: 0,
    totalFixedCosts: 0,
    totalVariableCosts: 0,
    totalSporadicCosts: 0,
    grossProfit: 0,
    netProfit: 0,
    profitPerPartner: 0,
    unpaidFixedCosts: 0,
  });
  const [loading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend
  }: {
    title: string;
    value: string;
    icon: typeof TrendingUp;
    trend?: 'up' | 'down'
  }) => (
    <div className="border border-black dark:border-white p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{title}</p>
          <p className="text-2xl font-bold text-black dark:text-white">{value}</p>
        </div>
        <div className={`p-2 ${trend === 'up' ? 'bg-black dark:bg-white' : trend === 'down' ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-800'}`}>
          <Icon className={`w-5 h-5 ${trend === 'up' ? 'text-white dark:text-black' : trend === 'down' ? 'text-white' : 'text-black dark:text-white'}`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600 dark:text-gray-400">Carregando métricas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Dashboard Financeiro"
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

      {metrics.unpaidFixedCosts > 0 && (
        <div className="border border-red-500 bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-600 dark:text-red-400">
            Atenção: Você tem {metrics.unpaidFixedCosts} custo(s) fixo(s) não pago(s) este mês.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Faturamento Total"
          value={formatCurrency(metrics.totalRevenue)}
          icon={DollarSign}
          trend="up"
        />
        <StatCard
          title="Lucro Bruto"
          value={formatCurrency(metrics.grossProfit)}
          icon={TrendingUp}
          trend={metrics.grossProfit > 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Lucro Líquido"
          value={formatCurrency(metrics.netProfit)}
          icon={TrendingUp}
          trend={metrics.netProfit > 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Lucro por Sócio (50%)"
          value={formatCurrency(metrics.profitPerPartner)}
          icon={Users}
          trend={metrics.profitPerPartner > 0 ? 'up' : 'down'}
        />
      </div>

      <div className="border border-black dark:border-white p-6">
        <h3 className="text-xl font-bold text-black dark:text-white mb-6">Resumo de Custos</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-800">
            <span className="text-gray-600 dark:text-gray-400">Custos Fixos</span>
            <span className="font-medium text-black dark:text-white">{formatCurrency(metrics.totalFixedCosts)}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-800">
            <span className="text-gray-600 dark:text-gray-400">Custos Variáveis</span>
            <span className="font-medium text-black dark:text-white">{formatCurrency(metrics.totalVariableCosts)}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-800">
            <span className="text-gray-600 dark:text-gray-400">Custos Esporádicos</span>
            <span className="font-medium text-black dark:text-white">{formatCurrency(metrics.totalSporadicCosts)}</span>
          </div>
          <div className="flex justify-between items-center pt-3">
            <span className="font-bold text-black dark:text-white">Total de Custos</span>
            <span className="font-bold text-black dark:text-white">
              {formatCurrency(metrics.totalFixedCosts + metrics.totalVariableCosts + metrics.totalSporadicCosts)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
