import React from 'react';
import { BookOpen, BarChart3, Settings, Plus } from 'lucide-react';
import type { AppView } from '../App';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

export function Layout({ children, currentView, onViewChange }: LayoutProps) {
  const navItems = [
    { id: 'decks' as AppView, label: 'Decks', icon: BookOpen },
    { id: 'stats' as AppView, label: 'Stats', icon: BarChart3 },
    { id: 'settings' as AppView, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">💀</div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Dear Bones
            </h1>
          </div>
          
          {currentView === 'decks' && (
            <button
              onClick={() => onViewChange('deck-edit')}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>New Deck</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex justify-center space-x-8">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onViewChange(id)}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-md transition-colors ${
                currentView === id
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
} 