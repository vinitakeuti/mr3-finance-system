 'use client';

import { Moon, Sun, LogOut, Menu, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

export function Layout({ children, currentView, onViewChange }: LayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'fixed', label: 'Custos Fixos' },
    { id: 'variable', label: 'Custos Variáveis' },
    { id: 'sporadic', label: 'Custos Esporádicos' },
    { id: 'revenue', label: 'Faturamento' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors">
      <header className="border-b border-black dark:border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-black dark:text-white">
              Controle Financeiro
            </h1>

            <div className="hidden md:flex items-center gap-6">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`text-sm font-medium transition-colors ${
                    currentView === item.id
                      ? 'text-black dark:text-white'
                      : 'text-gray-500 hover:text-black dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-white" />
                ) : (
                  <Moon className="w-5 h-5 text-black" />
                )}
              </button>

              <button
                onClick={signOut}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors hidden md:block"
              >
                <LogOut className="w-5 h-5 text-black dark:text-white" />
              </button>

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 md:hidden"
              >
                {menuOpen ? (
                  <X className="w-5 h-5 text-black dark:text-white" />
                ) : (
                  <Menu className="w-5 h-5 text-black dark:text-white" />
                )}
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-black dark:border-white">
            <div className="px-4 py-4 space-y-3">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    setMenuOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
                    currentView === item.id
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <button
                onClick={signOut}
                className="block w-full text-left px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                Sair
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
