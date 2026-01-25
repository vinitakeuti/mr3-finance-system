 'use client';

import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { FixedCosts } from './components/FixedCosts';
import { VariableCosts } from './components/VariableCosts';
import { SporadicCosts } from './components/SporadicCosts';
import { Revenue } from './components/Revenue';

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
      case 'fixed':
        return <FixedCosts />;
      case 'variable':
        return <VariableCosts />;
      case 'sporadic':
        return <SporadicCosts />;
      case 'revenue':
        return <Revenue />;
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
