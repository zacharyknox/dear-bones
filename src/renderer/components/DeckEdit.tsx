import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit3, Trash2, Save } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import type { AppView } from '../App';
import type { Deck, Card } from '../../types';

interface DeckEditProps {
  deckId: string | null;
  onViewChange: (view: AppView) => void;
}

export function DeckEdit({ deckId, onViewChange }: DeckEditProps) {
  const { getDeck, getCardsByDeck, createDeck, updateDeck, createCard, updateCard, deleteCard } = useAppStore();
  
  const isEditing = deckId !== null;
  const existingDeck = isEditing ? getDeck(deckId) : null;
  const existingCards = isEditing ? getCardsByDeck(deckId) : [];

  // Deck form state
  const [deckForm, setDeckForm] = useState({
    name: '',
    description: '',
    emoji: '📚',
    tags: [] as string[],
  });

  // Card form state
  const [showCardForm, setShowCardForm] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [cardForm, setCardForm] = useState({
    front: '',
    back: '',
    tags: [] as string[],
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (existingDeck) {
      setDeckForm({
        name: existingDeck.name,
        description: existingDeck.description || '',
        emoji: existingDeck.emoji || '📚',
        tags: existingDeck.tags,
      });
    }
  }, [existingDeck]);

  const handleSaveDeck = async () => {
    if (!deckForm.name.trim()) return;

    if (isEditing && deckId) {
      await updateDeck(deckId, deckForm);
    } else {
      await createDeck(deckForm);
    }
    
    onViewChange('decks');
  };

  const handleAddTag = (tagArray: string[], setTagArray: (tags: string[]) => void) => {
    if (tagInput.trim() && !tagArray.includes(tagInput.trim())) {
      setTagArray([...tagArray, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string, tagArray: string[], setTagArray: (tags: string[]) => void) => {
    setTagArray(tagArray.filter(tag => tag !== tagToRemove));
  };

  const handleCardSubmit = async () => {
    if (!cardForm.front.trim() || !cardForm.back.trim()) return;
    if (!deckId && !isEditing) return;

    const targetDeckId = deckId || (existingDeck?.id);
    if (!targetDeckId) return;

    if (editingCardId) {
      await updateCard(editingCardId, cardForm);
    } else {
      await createCard({
        ...cardForm,
        deckId: targetDeckId,
      });
    }

    setCardForm({ front: '', back: '', tags: [] });
    setShowCardForm(false);
    setEditingCardId(null);
  };

  const handleEditCard = (card: Card) => {
    setCardForm({
      front: card.front,
      back: card.back,
      tags: card.tags,
    });
    setEditingCardId(card.id);
    setShowCardForm(true);
  };

  const handleDeleteCard = async (cardId: string) => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      await deleteCard(cardId);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onViewChange('decks')}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              {isEditing ? 'Edit Deck' : 'New Deck'}
            </h2>
          </div>
          
          <button
            onClick={handleSaveDeck}
            className="btn-primary flex items-center space-x-2"
            disabled={!deckForm.name.trim()}
          >
            <Save size={16} />
            <span>Save Deck</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Deck Form */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Deck Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Deck Name *
                </label>
                <input
                  type="text"
                  value={deckForm.name}
                  onChange={(e) => setDeckForm({ ...deckForm, name: e.target.value })}
                  className="input"
                  placeholder="Enter deck name..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Emoji
                </label>
                <input
                  type="text"
                  value={deckForm.emoji}
                  onChange={(e) => setDeckForm({ ...deckForm, emoji: e.target.value })}
                  className="input"
                  placeholder="📚"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={deckForm.description}
                onChange={(e) => setDeckForm({ ...deckForm, description: e.target.value })}
                className="input"
                rows={3}
                placeholder="Describe your deck..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(deckForm.tags, (tags: string[]) => setDeckForm({ ...deckForm, tags }));
                    }
                  }}
                  className="input flex-1"
                  placeholder="Add a tag..."
                />
                <button
                  onClick={() => handleAddTag(deckForm.tags, (tags: string[]) => setDeckForm({ ...deckForm, tags }))}
                  className="btn-secondary"
                >
                  Add
                </button>
              </div>
              
              {deckForm.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {deckForm.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-md"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag, deckForm.tags, (tags: string[]) => setDeckForm({ ...deckForm, tags }))}
                        className="ml-1 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cards Section */}
          {isEditing && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Cards ({existingCards.length})
                </h3>
                <button
                  onClick={() => setShowCardForm(!showCardForm)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus size={16} />
                  <span>Add Card</span>
                </button>
              </div>

              {/* Card Form */}
              {showCardForm && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                    {editingCardId ? 'Edit Card' : 'New Card'}
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Front (Question) *
                      </label>
                      <textarea
                        value={cardForm.front}
                        onChange={(e) => setCardForm({ ...cardForm, front: e.target.value })}
                        className="input"
                        rows={3}
                        placeholder="Enter the question or prompt..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Back (Answer) *
                      </label>
                      <textarea
                        value={cardForm.back}
                        onChange={(e) => setCardForm({ ...cardForm, back: e.target.value })}
                        className="input"
                        rows={3}
                        placeholder="Enter the answer or explanation..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setShowCardForm(false);
                        setEditingCardId(null);
                        setCardForm({ front: '', back: '', tags: [] });
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCardSubmit}
                      className="btn-primary"
                      disabled={!cardForm.front.trim() || !cardForm.back.trim()}
                    >
                      {editingCardId ? 'Update Card' : 'Add Card'}
                    </button>
                  </div>
                </div>
              )}

              {/* Cards List */}
              {existingCards.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🃏</div>
                  <p className="text-gray-600 dark:text-gray-400">
                    No cards yet. Add your first card to get started!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {existingCards.map((card) => (
                    <div key={card.id} className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                            Front
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {card.front}
                          </p>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                            Back
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {card.back}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-1 ml-4">
                        <button
                          onClick={() => handleEditCard(card)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                          title="Edit card"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                          title="Delete card"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 