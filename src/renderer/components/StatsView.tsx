import React from 'react';
import { Calendar, Target, Clock, TrendingUp } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export function StatsView() {
  const { getStudyStats, decks } = useAppStore();
  const globalStats = getStudyStats();

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Study Statistics
        </h2>

        {/* Global Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Target className="text-blue-600 dark:text-blue-400" size={20} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Cards
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {globalStats.totalCards}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Calendar className="text-green-600 dark:text-green-400" size={20} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Studied Today
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {globalStats.cardsStudiedToday}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp className="text-purple-600 dark:text-purple-400" size={20} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Accuracy
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {Math.round(globalStats.accuracy)}%
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Clock className="text-orange-600 dark:text-orange-400" size={20} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Time Spent
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {Math.round(globalStats.timeSpent)}m
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Deck-wise Stats */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Deck Performance
          </h3>
          
          {decks.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-gray-600 dark:text-gray-400">
                No decks available for statistics.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {decks.map((deck) => {
                const deckStats = getStudyStats(deck.id);
                
                return (
                  <div key={deck.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-xl">{deck.emoji || '📚'}</div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {deck.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {deck.cardCount} cards
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {deckStats.cardsStudiedToday}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">Today</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {Math.round(deckStats.accuracy)}%
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">Accuracy</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {Math.round(deckStats.timeSpent)}m
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">Time</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Progress Chart Placeholder */}
        <div className="card p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Study Progress
          </h3>
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📈</div>
            <p className="text-gray-600 dark:text-gray-400">
              Progress charts coming soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 