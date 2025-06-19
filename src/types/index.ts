export interface Deck {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  cardCount: number;
}

export interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  lastStudied?: Date;
  studyCount: number;
  difficulty: number; // SM2 algorithm difficulty factor
  interval: number; // Days until next review
  easeFactor: number; // SM2 ease factor
}

export interface StudySession {
  id: string;
  deckId: string;
  cardId: string;
  confidence: number; // 1-5 rating
  responseTime: number; // milliseconds
  studiedAt: Date;
}

export interface StudyStats {
  totalCards: number;
  cardsStudiedToday: number;
  accuracy: number;
  timeSpent: number; // minutes
  streak: number;
}

export type StudyMode = 'standard' | 'spaced-repetition' | 'shuffle';

export type Theme = 'light' | 'dark' | 'system';

export interface AppSettings {
  theme: Theme;
  studyMode: StudyMode;
  cardsPerSession: number;
  showTimer: boolean;
  enableSounds: boolean;
} 