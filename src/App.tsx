 'use client';

import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Costs } from './components/Costs';
import { Revenue } from './components/Revenue';
import { DailyEntries } from './components/DailyEntries';
import { AdminUsers } from './components/AdminUsers';
import { AdminAllowedEmails } from './components/AdminAllowedEmails';
import { Vault } from './components/Vault';
import { Kanban } from './components/Kanban';

function App() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center transition-colors">
        <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'costs':
        return <Costs />;
      case 'entries':
        return <DailyEntries />;
      case 'revenue':
        return <Revenue />;
      case 'vault':
        return user?.canAccessVault ? <Vault /> : <Dashboard />;
      case 'kanban':
        return <Kanban />;
      case 'admin-users':
        return <AdminUsers />;
      case 'admin-allowed-emails':
        return <AdminAllowedEmails />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderView()}
    </Layout>
  );
}

export default App;
