import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Deck, Card, StudySession, StudyStats, AppSettings } from '../../types';

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
          // TODO: Load data from SQLite database
          // For now, we'll use mock data
          const mockDecks: Deck[] = [
            {
              id: '1',
              name: 'Spanish Vocabulary',
              description: 'Essential Spanish words and phrases',
              emoji: '🇪🇸',
              tags: ['language', 'spanish'],
              createdAt: new Date(),
              updatedAt: new Date(),
              cardCount: 25,
            },
            {
              id: '2',
              name: 'Biology Terms',
              description: 'Key concepts in biology',
              emoji: '🧬',
              tags: ['science', 'biology'],
              createdAt: new Date(),
              updatedAt: new Date(),
              cardCount: 15,
            },
          ];

          const mockCards: Card[] = [
            {
              id: '1',
              deckId: '1',
              front: 'Hello',
              back: 'Hola',
              tags: ['greetings'],
              createdAt: new Date(),
              updatedAt: new Date(),
              studyCount: 0,
              difficulty: 0,
              interval: 1,
              easeFactor: 2.5,
            },
            {
              id: '2',
              deckId: '1',
              front: 'Thank you',
              back: 'Gracias',
              tags: ['greetings'],
              createdAt: new Date(),
              updatedAt: new Date(),
              studyCount: 0,
              difficulty: 0,
              interval: 1,
              easeFactor: 2.5,
            },
          ];

          set({ 
            decks: mockDecks, 
            cards: mockCards, 
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to initialize app', 
            isLoading: false 
          });
        }
      },

      // Deck actions
      createDeck: async (deckData) => {
        const newDeck: Deck = {
          ...deckData,
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
          cardCount: 0,
        };
        
        set(state => ({
          decks: [...state.decks, newDeck]
        }));
      },

      updateDeck: async (id, updates) => {
        set(state => ({
          decks: state.decks.map(deck =>
            deck.id === id 
              ? { ...deck, ...updates, updatedAt: new Date() }
              : deck
          )
        }));
      },

      deleteDeck: async (id) => {
        set(state => ({
          decks: state.decks.filter(deck => deck.id !== id),
          cards: state.cards.filter(card => card.deckId !== id)
        }));
      },

      getDeck: (id) => {
        return get().decks.find(deck => deck.id === id);
      },

      // Card actions
      createCard: async (cardData) => {
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
        
        set(state => ({
          cards: [...state.cards, newCard],
          decks: state.decks.map(deck =>
            deck.id === cardData.deckId
              ? { ...deck, cardCount: deck.cardCount + 1 }
              : deck
          )
        }));
      },

      updateCard: async (id, updates) => {
        set(state => ({
          cards: state.cards.map(card =>
            card.id === id 
              ? { ...card, ...updates, updatedAt: new Date() }
              : card
          )
        }));
      },

      deleteCard: async (id) => {
        const card = get().cards.find(c => c.id === id);
        if (!card) return;

        set(state => ({
          cards: state.cards.filter(card => card.id !== id),
          decks: state.decks.map(deck =>
            deck.id === card.deckId
              ? { ...deck, cardCount: deck.cardCount - 1 }
              : deck
          )
        }));
      },

      getCardsByDeck: (deckId) => {
        return get().cards.filter(card => card.deckId === deckId);
      },

      // Study actions
      recordStudySession: async (sessionData) => {
        const newSession: StudySession = {
          ...sessionData,
          id: Date.now().toString(),
          studiedAt: new Date(),
        };
        
        set(state => ({
          studySessions: [...state.studySessions, newSession]
        }));
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
        set(state => ({
          settings: { ...state.settings, ...updates }
        }));
      },
    }),
    {
      name: 'dear-bones-store',
    }
  )
); 