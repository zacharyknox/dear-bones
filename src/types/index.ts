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

// Card Type System
export type CardType = 'text' | 'audio' | 'mixed';

export interface BaseCard {
  id: string;
  deckId: string;
  type: CardType;
  back: string; // Answer is always text
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  lastStudied?: Date;
  studyCount: number;
  difficulty: number; // SM2 algorithm difficulty factor
  interval: number; // Days until next review
  easeFactor: number; // SM2 ease factor
}

export interface TextCard extends BaseCard {
  type: 'text';
  front: string;
}

export interface AudioCard extends BaseCard {
  type: 'audio';
  frontAudioPath: string;
  frontAudioName: string; // Display name for the audio
}

export interface MixedCard extends BaseCard {
  type: 'mixed';
  front: string;
  frontAudioPath: string;
  frontAudioName: string;
}

export type Card = TextCard | AudioCard | MixedCard;

// Type guards for runtime checking
export const isTextCard = (card: Card): card is TextCard => card.type === 'text';
export const isAudioCard = (card: Card): card is AudioCard => card.type === 'audio';
export const isMixedCard = (card: Card): card is MixedCard => card.type === 'mixed';
export const hasAudio = (card: Card): card is AudioCard | MixedCard => 
  card.type === 'audio' || card.type === 'mixed';

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