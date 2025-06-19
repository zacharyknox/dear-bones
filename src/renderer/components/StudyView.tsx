import React, { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Shuffle } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import type { AppView } from '../App';
import type { Card } from '../../types';

interface StudyViewProps {
  deckId: string | null;
  onViewChange: (view: AppView) => void;
}

export function StudyView({ deckId, onViewChange }: StudyViewProps) {
  const { getDeck, getCardsByDeck, recordStudySession } = useAppStore();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyCards, setStudyCards] = useState<Card[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());

  const deck = deckId ? getDeck(deckId) : null;
  
  useEffect(() => {
    if (deckId) {
      const cards = getCardsByDeck(deckId);
      setStudyCards(cards);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setSessionStartTime(Date.now());
    }
  }, [deckId, getCardsByDeck]);

  const currentCard = studyCards[currentCardIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleConfidenceRating = async (confidence: number) => {
    if (!currentCard || !deckId) return;

    const responseTime = Date.now() - sessionStartTime;
    
    await recordStudySession({
      deckId,
      cardId: currentCard.id,
      confidence,
      responseTime,
    });

    // Move to next card
    if (currentCardIndex < studyCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
      setSessionStartTime(Date.now());
    } else {
      // Study session complete
      onViewChange('decks');
    }
  };

  const handleShuffle = () => {
    const shuffled = [...studyCards].sort(() => Math.random() - 0.5);
    setStudyCards(shuffled);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  const handleRestart = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setSessionStartTime(Date.now());
  };

  if (!deck || !currentCard) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No cards to study
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This deck is empty or doesn't exist.
          </p>
          <button
            onClick={() => onViewChange('decks')}
            className="btn-primary"
          >
            Back to Decks
          </button>
        </div>
      </div>
    );
  }

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
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                {deck.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Card {currentCardIndex + 1} of {studyCards.length}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleShuffle}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Shuffle cards"
            >
              <Shuffle size={16} />
            </button>
            <button
              onClick={handleRestart}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Restart session"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Study Area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-8">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentCardIndex + 1) / studyCards.length) * 100}%`,
              }}
            />
          </div>

          {/* Flashcard */}
          <div
            className="card p-8 min-h-[300px] flex items-center justify-center cursor-pointer transform transition-transform hover:scale-105"
            onClick={handleFlip}
          >
            <div className="text-center">
              <div className="text-lg text-gray-900 dark:text-gray-100 mb-4 flashcard-text">
                {isFlipped ? currentCard.back : currentCard.front}
              </div>
              {!isFlipped && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click to reveal answer
                </p>
              )}
            </div>
          </div>

          {/* Confidence Buttons */}
          {isFlipped && (
            <div className="mt-8 flex justify-center space-x-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  How confident are you with this card?
                </p>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => handleConfidenceRating(rating)}
                      className={`px-4 py-2 rounded-md transition-colors ${
                        rating <= 2
                          ? 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300'
                          : rating === 3
                          ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 dark:text-yellow-300'
                          : 'bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-300'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <span>Hard</span>
                  <span>Easy</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 