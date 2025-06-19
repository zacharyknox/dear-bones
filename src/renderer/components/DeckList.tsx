import React, { useState } from 'react';
import { Play, Edit3, Trash2, Search } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import type { AppView } from '../App';

interface DeckListProps {
  onViewChange: (view: AppView, deckId?: string) => void;
}

export function DeckList({ onViewChange }: DeckListProps) {
  const { decks, deleteDeck } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDecks = decks.filter(deck =>
    deck.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deck.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDeleteDeck = async (deckId: string) => {
    if (window.confirm('Are you sure you want to delete this deck? This action cannot be undone.')) {
      await deleteDeck(deckId);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search Bar */}
      <div className="p-6 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search decks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Deck Grid */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {filteredDecks.length === 0 ? (
          <div className="text-center py-12">
            {decks.length === 0 ? (
              <div>
                <div className="text-4xl mb-4">📚</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No decks yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Create your first flashcard deck to get started!
                </p>
                <button
                  onClick={() => onViewChange('deck-edit')}
                  className="btn-primary"
                >
                  Create Deck
                </button>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No decks found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search terms.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDecks.map((deck) => (
              <div key={deck.id} className="card p-6 hover:shadow-md transition-shadow">
                {/* Deck Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{deck.emoji || '📚'}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {deck.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {deck.cardCount} cards
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    <button
                      onClick={() => onViewChange('deck-edit', deck.id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                      title="Edit deck"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteDeck(deck.id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                      title="Delete deck"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {deck.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {deck.description}
                  </p>
                )}

                {/* Tags */}
                {deck.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {deck.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                    {deck.tags.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md">
                        +{deck.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Study Button */}
                <button
                  onClick={() => onViewChange('study', deck.id)}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                  disabled={deck.cardCount === 0}
                >
                  <Play size={16} />
                  <span>Study</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 