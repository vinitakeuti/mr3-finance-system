 'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import { SectionHeader } from './SectionHeader';

export function VariableCosts() {
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [formData, setFormData] = useState({
    ad_accounts_purchase: '',
    gateway_percentage: '',
    withdrawal_count: '',
    p2p_transfers: '',
  });
  const [existingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    // Modo teste: apenas simula salvamento local, sem banco de dados
    alert('Custos variáveis salvos (modo teste, sem integração com banco de dados).');
    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calculateWithdrawalTotal = () => {
    const count = parseInt(formData.withdrawal_count) || 0;
    return count * 10;
  };

  const calculateP2PFees = () => {
    const transfers = parseFloat(formData.p2p_transfers) || 0;
    return transfers * 0.05;
  };

  const calculateTotal = () => {
    const adAccounts = parseFloat(formData.ad_accounts_purchase) || 0;
    const gateway = parseFloat(formData.gateway_percentage) || 0;
    const withdrawalTotal = calculateWithdrawalTotal();
    const p2pFees = calculateP2PFees();
    return adAccounts + gateway + withdrawalTotal + p2pFees;
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Custos Variáveis"
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

      <div className="border border-black dark:border-white p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Compra de Contas de Anúncio (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.ad_accounts_purchase}
                onChange={(e) => setFormData({ ...formData, ad_accounts_purchase: e.target.value })}
                className="w-full px-4 py-2 border border-black dark:border-white bg-transparent text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                placeholder="0,00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Taxa de Gateway de Pagamento (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.gateway_percentage}
                onChange={(e) => setFormData({ ...formData, gateway_percentage: e.target.value })}
                className="w-full px-4 py-2 border border-black dark:border-white bg-transparent text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                placeholder="0,00"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Percentual do gateway sobre o faturamento
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Quantidade de Saques
              </label>
              <input
                type="number"
                min="0"
                value={formData.withdrawal_count}
                onChange={(e) => setFormData({ ...formData, withdrawal_count: e.target.value })}
                className="w-full px-4 py-2 border border-black dark:border-white bg-transparent text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                placeholder="0"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Cada saque custa R$ 10,00 = Total: {formatCurrency(calculateWithdrawalTotal())}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Valor de Transferências P2P (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.p2p_transfers}
                onChange={(e) => setFormData({ ...formData, p2p_transfers: e.target.value })}
                className="w-full px-4 py-2 border border-black dark:border-white bg-transparent text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                placeholder="0,00"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Taxa de 5% = {formatCurrency(calculateP2PFees())}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xl font-bold text-black dark:text-white">Total de Custos Variáveis</span>
              <span className="text-2xl font-bold text-black dark:text-white">
                {formatCurrency(calculateTotal())}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Salvando...' : existingId ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>

      <div className="border border-black dark:border-white p-6">
        <h3 className="text-xl font-bold text-black dark:text-white mb-4">Sobre os Custos Variáveis</h3>
        <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
          <p><span className="font-medium">Compra de Contas:</span> Valor investido na compra de contas de anúncio</p>
          <p><span className="font-medium">Gateway:</span> Percentual cobrado pelos processadores de pagamento sobre as vendas</p>
          <p><span className="font-medium">Saques:</span> Quantidade de saques realizados (R$ 10,00 cada)</p>
          <p><span className="font-medium">Transferências P2P:</span> Valor de transferências pessoa-a-pessoa (taxa de 5%)</p>
        </div>
      </div>
    </div>
  );
}
