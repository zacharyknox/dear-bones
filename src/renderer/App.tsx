import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { DeckList } from './components/DeckList';
import { StudyView } from './components/StudyView';
import { StatsView } from './components/StatsView';
import { SettingsView } from './components/SettingsView';
import { DeckEdit } from './components/DeckEdit';
import { useAppStore } from './store/appStore';
import type { Theme } from '../types';

export type AppView = 'decks' | 'study' | 'stats' | 'settings' | 'deck-edit';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('decks');
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('system');
  
  // Initialize app store
  const { initializeApp } = useAppStore();

  useEffect(() => {
    initializeApp();
    
    // Apply theme to document
    const applyTheme = (newTheme: Theme) => {
      const root = document.documentElement;
      if (newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme(theme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme(theme);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, initializeApp]);

  const handleViewChange = (view: AppView, deckId?: string) => {
    setCurrentView(view);
    if (deckId) {
      setSelectedDeckId(deckId);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'decks':
        return <DeckList onViewChange={handleViewChange} />;
      case 'study':
        return <StudyView deckId={selectedDeckId} onViewChange={handleViewChange} />;
      case 'stats':
        return <StatsView />;
      case 'settings':
        return <SettingsView theme={theme} onThemeChange={setTheme} />;
      case 'deck-edit':
        return <DeckEdit deckId={selectedDeckId} onViewChange={handleViewChange} />;
      default:
        return <DeckList onViewChange={handleViewChange} />;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={handleViewChange}>
      {renderView()}
    </Layout>
  );
} 