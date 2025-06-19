import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Deck, Card, StudySession, StudyStats, AppSettings } from '../../types';

// Extend window interface for Electron API
declare global {
  interface Window {
    electronAPI: {
      getDecks: () => Promise<Deck[]>;
      createDeck: (deck: any) => Promise<any>;
      updateDeck: (id: string, updates: any) => Promise<any>;
      deleteDeck: (id: string) => Promise<any>;
      getCards: (deckId: string) => Promise<Card[]>;
      createCard: (card: any) => Promise<any>;
      updateCard: (id: string, updates: any) => Promise<any>;
      deleteCard: (id: string) => Promise<any>;
      getStudySessions: (deckId?: string) => Promise<StudySession[]>;
      createStudySession: (session: any) => Promise<any>;
      getSettings: () => Promise<Record<string, any>>;
      updateSetting: (key: string, value: any) => Promise<any>;
      exportCSV: (deckId?: string) => Promise<any>;
      importCSV: (targetDeckId?: string) => Promise<any>;
    };
  }
}

interface AppState {
  // Data
  decks: Deck[];
  cards: Card[];
  studySessions: StudySession[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Settings
  settings: AppSettings;
  
  // Actions
  initializeApp: () => Promise<void>;
  
  // Deck actions
  createDeck: (deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt' | 'cardCount'>) => Promise<void>;
  updateDeck: (id: string, updates: Partial<Deck>) => Promise<void>;
  deleteDeck: (id: string) => Promise<void>;
  getDeck: (id: string) => Deck | undefined;
  
  // Card actions
  createCard: (card: Omit<Card, 'id' | 'createdAt' | 'updatedAt' | 'studyCount' | 'difficulty' | 'interval' | 'easeFactor'>) => Promise<void>;
  updateCard: (id: string, updates: Partial<Card>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  getCardsByDeck: (deckId: string) => Card[];
  
  // Study actions
  recordStudySession: (session: Omit<StudySession, 'id' | 'studiedAt'>) => Promise<void>;
  getStudyStats: (deckId?: string) => StudyStats;
  
  // Settings actions
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  
  // CSV Import/Export actions
  exportDeckToCSV: (deckId?: string) => Promise<any>;
  importDeckFromCSV: (targetDeckId?: string) => Promise<any>;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Initial state
      decks: [],
      cards: [],
      studySessions: [],
      isLoading: false,
      error: null,
      settings: {
        theme: 'system',
        studyMode: 'spaced-repetition',
        cardsPerSession: 20,
        showTimer: true,
        enableSounds: false,
      },

      // Initialize app - load data from database
      initializeApp: async () => {
        set({ isLoading: true, error: null });
        try {
          // Load decks from database
          const decks = await window.electronAPI.getDecks();
          
          // Load all cards for all decks
          const allCards: Card[] = [];
          for (const deck of decks) {
            const deckCards = await window.electronAPI.getCards(deck.id);
            allCards.push(...deckCards);
          }
          
          // Load study sessions
          const studySessions = await window.electronAPI.getStudySessions();
          
          // Load settings
          const dbSettings = await window.electronAPI.getSettings();
          const settings = {
            theme: dbSettings.theme || 'system',
            studyMode: dbSettings.studyMode || 'spaced-repetition',
            cardsPerSession: dbSettings.cardsPerSession || 20,
            showTimer: dbSettings.showTimer !== undefined ? dbSettings.showTimer : true,
            enableSounds: dbSettings.enableSounds !== undefined ? dbSettings.enableSounds : false,
          };

          set({ 
            decks, 
            cards: allCards, 
            studySessions,
            settings,
            isLoading: false 
          });
        } catch (error) {
          console.error('Error initializing app:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to initialize app', 
            isLoading: false 
          });
        }
      },

      // Deck actions
      createDeck: async (deckData) => {
        try {
          const newDeck: Deck = {
            ...deckData,
            id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
            cardCount: 0,
          };
          
          await window.electronAPI.createDeck(newDeck);
          
          set(state => ({
            decks: [...state.decks, newDeck]
          }));
        } catch (error) {
          console.error('Error creating deck:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to create deck' });
        }
      },

      updateDeck: async (id, updates) => {
        try {
          await window.electronAPI.updateDeck(id, updates);
          
          set(state => ({
            decks: state.decks.map(deck =>
              deck.id === id 
                ? { ...deck, ...updates, updatedAt: new Date() }
                : deck
            )
          }));
        } catch (error) {
          console.error('Error updating deck:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to update deck' });
        }
      },

      deleteDeck: async (id) => {
        try {
          await window.electronAPI.deleteDeck(id);
          
          set(state => ({
            decks: state.decks.filter(deck => deck.id !== id),
            cards: state.cards.filter(card => card.deckId !== id)
          }));
        } catch (error) {
          console.error('Error deleting deck:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to delete deck' });
        }
      },

      getDeck: (id) => {
        return get().decks.find(deck => deck.id === id);
      },

      // Card actions
      createCard: async (cardData) => {
        try {
          const newCard: Card = {
            ...cardData,
            id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
            studyCount: 0,
            difficulty: 0,
            interval: 1,
            easeFactor: 2.5,
          };
          
          await window.electronAPI.createCard(newCard);
          
          set(state => ({
            cards: [...state.cards, newCard],
            decks: state.decks.map(deck =>
              deck.id === cardData.deckId
                ? { ...deck, cardCount: deck.cardCount + 1 }
                : deck
            )
          }));
        } catch (error) {
          console.error('Error creating card:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to create card' });
        }
      },

      updateCard: async (id, updates) => {
        try {
          await window.electronAPI.updateCard(id, updates);
          
          set(state => ({
            cards: state.cards.map(card =>
              card.id === id 
                ? { ...card, ...updates, updatedAt: new Date() }
                : card
            )
          }));
        } catch (error) {
          console.error('Error updating card:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to update card' });
        }
      },

      deleteCard: async (id) => {
        try {
          const card = get().cards.find(c => c.id === id);
          if (!card) return;

          await window.electronAPI.deleteCard(id);

          set(state => ({
            cards: state.cards.filter(card => card.id !== id),
            decks: state.decks.map(deck =>
              deck.id === card.deckId
                ? { ...deck, cardCount: deck.cardCount - 1 }
                : deck
            )
          }));
        } catch (error) {
          console.error('Error deleting card:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to delete card' });
        }
      },

      getCardsByDeck: (deckId) => {
        return get().cards.filter(card => card.deckId === deckId);
      },

      // Study actions
      recordStudySession: async (sessionData) => {
        try {
          const newSession: StudySession = {
            ...sessionData,
            id: Date.now().toString(),
            studiedAt: new Date(),
          };
          
          await window.electronAPI.createStudySession(newSession);
          
          set(state => ({
            studySessions: [...state.studySessions, newSession]
          }));
        } catch (error) {
          console.error('Error recording study session:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to record study session' });
        }
      },

      getStudyStats: (deckId) => {
        const sessions = get().studySessions;
        const filteredSessions = deckId 
          ? sessions.filter(s => s.deckId === deckId)
          : sessions;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todaySessions = filteredSessions.filter(s => 
          s.studiedAt >= today
        );

        return {
          totalCards: deckId ? get().getCardsByDeck(deckId).length : get().cards.length,
          cardsStudiedToday: todaySessions.length,
          accuracy: filteredSessions.length > 0 
            ? filteredSessions.reduce((acc, s) => acc + s.confidence, 0) / filteredSessions.length * 20
            : 0,
          timeSpent: filteredSessions.reduce((acc, s) => acc + s.responseTime, 0) / 60000, // Convert to minutes
          streak: 0, // TODO: Calculate streak
        };
      },

      // Settings actions
      updateSettings: async (updates) => {
        try {
          // Update each setting in the database
          for (const [key, value] of Object.entries(updates)) {
            await window.electronAPI.updateSetting(key, value);
          }
          
          set(state => ({
            settings: { ...state.settings, ...updates }
          }));
        } catch (error) {
          console.error('Error updating settings:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to update settings' });
        }
      },

      // CSV Import/Export actions
      exportDeckToCSV: async (deckId) => {
        try {
          const result = await window.electronAPI.exportCSV(deckId);
          if (result.success) {
            set({ error: null });
            return result;
          } else {
            set({ error: result.error });
            return result;
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Export failed';
          set({ error: errorMsg });
          return { success: false, error: errorMsg };
        }
      },

      importDeckFromCSV: async (targetDeckId) => {
        try {
          const result = await window.electronAPI.importCSV(targetDeckId);
          if (result.success) {
            // Refresh data after import
            await get().initializeApp();
            set({ error: null });
            return result;
          } else {
            set({ error: result.error });
            return result;
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Import failed';
          set({ error: errorMsg });
          return { success: false, error: errorMsg };
        }
      },
    }),
    {
      name: 'dear-bones-store',
    }
  )
); 