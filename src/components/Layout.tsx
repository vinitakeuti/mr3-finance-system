'use client';

import {
  Moon, Sun, LogOut, Menu, X,
  LayoutDashboard, Receipt, ArrowLeftRight, BarChart3, Lock, ClipboardList,
  Users, Mail, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import Image from 'next/image';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect, useMemo } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

const allNav = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'costs', label: 'Custos', icon: Receipt },
  { id: 'entries', label: 'Lançamentos', icon: ArrowLeftRight },
  { id: 'revenue', label: 'Resumo', icon: BarChart3 },
  { id: 'vault', label: 'Cofre', icon: Lock },
  { id: 'kanban', label: 'Tarefas', icon: ClipboardList },
];

const adminNav = [
  { id: 'admin-users', label: 'Usuários', icon: Users },
  { id: 'admin-allowed-emails', label: 'Emails', icon: Mail },
];

export function Layout({ children, currentView, onViewChange }: LayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('sidebar_collapsed') === 'true') setCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    setCollapsed(c => {
      localStorage.setItem('sidebar_collapsed', String(!c));
      return !c;
    });
  };

  const go = (id: string) => { onViewChange(id); setDrawerOpen(false); };
  const isAdmin = user?.role === 'MASTER';
  const canVault = user?.canAccessVault ?? false;

  const mainNav = useMemo(() => canVault ? allNav : allNav.filter(i => i.id !== 'vault'), [canVault]);
  const mobileTabNav = useMemo(() => mainNav.filter(i => i.id !== 'vault'), [mainNav]);

  const NavItem = ({ item, compact = false }: { item: typeof allNav[0]; compact?: boolean }) => {
    const active = currentView === item.id;
    return (
      <button
        onClick={() => go(item.id)}
        title={compact ? item.label : undefined}
        className={`flex items-center gap-3 w-full px-3 py-2 text-[13px] transition-colors ${
          compact ? 'justify-center' : ''
        } ${
          active
            ? 'text-neutral-900 dark:text-white font-medium'
            : 'text-neutral-500 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
        }`}
      >
        <item.icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={active ? 2 : 1.5} />
        {!compact && <span>{item.label}</span>}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-30 bg-white dark:bg-neutral-925 border-r border-neutral-200 dark:border-neutral-800 transition-[width] duration-200 ${collapsed ? 'w-16' : 'w-56'}`}>
        <div className={`flex items-center h-14 ${collapsed ? 'justify-center' : 'px-4'}`}>
          <button onClick={() => go('dashboard')} className="focus:outline-none">
            {collapsed ? (
              <div className="relative h-7 w-7"><Image src="/assets/images/logo.png" alt="MR3" fill className="object-contain" sizes="28px" priority /></div>
            ) : (
              <div className="relative h-7 w-28"><Image src="/assets/images/logo.png" alt="MR3 Digital" fill className="object-contain" sizes="112px" priority /></div>
            )}
          </button>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {mainNav.map(item => <NavItem key={item.id} item={item} compact={collapsed} />)}
          {isAdmin && (
            <>
              <div className="my-3 mx-3 border-t border-neutral-150 dark:border-neutral-800" />
              {adminNav.map(item => <NavItem key={item.id} item={item} compact={collapsed} />)}
            </>
          )}
        </nav>

        <div className={`border-t border-neutral-150 dark:border-neutral-800 py-3 px-2 space-y-1`}>
          {!collapsed && user && (
            <div className="px-3 pb-2">
              <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100 truncate">{user.name}</p>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-600 truncate">{user.email}</p>
            </div>
          )}
          <div className={`flex items-center ${collapsed ? 'flex-col gap-1' : 'gap-0.5 px-1'}`}>
            <button onClick={toggleTheme} className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={signOut} className="p-2 text-neutral-400 hover:text-negative transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
            {!collapsed && (
              <button onClick={toggleCollapse} className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors ml-auto">
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
            {collapsed && (
              <button onClick={toggleCollapse} className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 h-12 bg-white dark:bg-neutral-925 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4">
        <button onClick={() => go('dashboard')} className="focus:outline-none">
          <div className="relative h-6 w-24"><Image src="/assets/images/logo.png" alt="MR3" fill className="object-contain" sizes="96px" priority /></div>
        </button>
        <div className="flex items-center gap-1">
          <button onClick={toggleTheme} className="p-2 text-neutral-500">
            {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>
          <button onClick={() => setDrawerOpen(!drawerOpen)} className="p-2 text-neutral-500">
            {drawerOpen ? <X className="w-[18px] h-[18px]" /> : <Menu className="w-[18px] h-[18px]" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-40 animate-fade-in">
          <div className="absolute inset-0 bg-black/30 dark:bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-neutral-925 animate-slide-in">
            <div className="h-12 flex items-center px-4 border-b border-neutral-200 dark:border-neutral-800">
              <div className="relative h-6 w-24"><Image src="/assets/images/logo.png" alt="MR3" fill className="object-contain" sizes="96px" /></div>
            </div>
            <nav className="py-3 px-2 space-y-0.5">
              {mainNav.map(item => <NavItem key={item.id} item={item} />)}
              {isAdmin && (
                <>
                  <div className="my-3 mx-3 border-t border-neutral-150 dark:border-neutral-800" />
                  {adminNav.map(item => <NavItem key={item.id} item={item} />)}
                </>
              )}
            </nav>
            {user && (
              <div className="absolute bottom-0 left-0 right-0 border-t border-neutral-150 dark:border-neutral-800 p-4">
                <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100 truncate">{user.name}</p>
                <p className="text-[11px] text-neutral-400 truncate mb-3">{user.email}</p>
                <button onClick={signOut} className="text-[13px] text-negative hover:underline">Sair</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile bottom tabs */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white dark:bg-neutral-925 border-t border-neutral-200 dark:border-neutral-800 safe-bottom">
        <div className="flex items-stretch h-14">
          {mobileTabNav.map(item => {
            const active = currentView === item.id;
            return (
              <button key={item.id} onClick={() => go(item.id)} className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${active ? 'text-neutral-900 dark:text-white' : 'text-neutral-400 dark:text-neutral-600'}`}>
                <item.icon className="w-[18px] h-[18px]" strokeWidth={active ? 2 : 1.5} />
                <span className="text-2xs font-medium">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main content */}
      <main className={`transition-[margin] duration-200 pt-12 pb-16 md:pt-0 md:pb-0 ${collapsed ? 'md:ml-16' : 'md:ml-56'}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
