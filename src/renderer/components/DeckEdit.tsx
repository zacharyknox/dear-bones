import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit3, Trash2, Save, Download, Upload, FileAudio, Type, Mic, File } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { AudioPlayer } from './AudioPlayer';
import { LatexText } from './LatexText';
import type { AppView } from '../App';
import type { Deck, Card, CardType, CreateCardInput } from '../../types';
import { isTextCard, isAudioCard, isMixedCard, hasAudio } from '../../types';

interface DeckEditProps {
  deckId: string | null;
  onViewChange: (view: AppView) => void;
}

export function DeckEdit({ deckId, onViewChange }: DeckEditProps) {
  const { getDeck, getCardsByDeck, createDeck, updateDeck, createCard, updateCard, deleteCard, exportDeckToCSV, importDeckFromCSV } = useAppStore();
  
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
  const [cardType, setCardType] = useState<CardType>('text');
  const [cardForm, setCardForm] = useState({
    front: '',
    back: '',
    frontAudioPath: '',
    frontAudioName: '',
    tags: [] as string[],
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUploading, setAudioUploading] = useState(false);

  const [tagInput, setTagInput] = useState('');
  
  // CSV state
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

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

  const handleAudioFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
      if (!cardForm.frontAudioName) {
        setCardForm(prev => ({ ...prev, frontAudioName: file.name }));
      }
    }
  };

  const resetCardForm = () => {
    setCardForm({ front: '', back: '', frontAudioPath: '', frontAudioName: '', tags: [] });
    setAudioFile(null);
    setCardType('text');
    setShowCardForm(false);
    setEditingCardId(null);
  };

  const handleCardSubmit = async () => {
    // Validate based on card type
    if (!cardForm.back.trim()) return;
    
    if (cardType === 'text' && !cardForm.front.trim()) return;
    if ((cardType === 'audio' || cardType === 'mixed') && !cardForm.frontAudioPath && !audioFile) return;
    if (cardType === 'mixed' && !cardForm.front.trim()) return;
    
    if (!deckId && !isEditing) return;

    const targetDeckId = deckId || (existingDeck?.id);
    if (!targetDeckId) return;

    try {
      let audioPath = cardForm.frontAudioPath;
      let audioName = cardForm.frontAudioName;
      
      // Handle audio file upload if new file selected
      if (audioFile && (cardType === 'audio' || cardType === 'mixed')) {
        setAudioUploading(true);
        const result = await window.electronAPI.audioImportFile(audioFile.path || audioFile.name);
        
        if (result.success) {
          audioPath = result.internalPath;
          audioName = audioFile.name;
        } else {
          console.error('Audio upload failed:', result.error);
          return;
        }
      }

      let cardData: CreateCardInput;

      // Create card data based on type
      switch (cardType) {
        case 'text':
          cardData = {
            type: 'text',
            deckId: targetDeckId,
            front: cardForm.front,
            back: cardForm.back,
            tags: cardForm.tags,
          };
          break;
        case 'audio':
          cardData = {
            type: 'audio',
            deckId: targetDeckId,
            back: cardForm.back,
            frontAudioPath: audioPath,
            frontAudioName: audioName,
            tags: cardForm.tags,
          };
          break;
        case 'mixed':
          cardData = {
            type: 'mixed',
            deckId: targetDeckId,
            front: cardForm.front,
            back: cardForm.back,
            frontAudioPath: audioPath,
            frontAudioName: audioName,
            tags: cardForm.tags,
          };
          break;
        default:
          return;
      }

      if (editingCardId) {
        await updateCard(editingCardId, cardData);
      } else {
        await createCard(cardData);
      }

      // Reset form
      resetCardForm();
      
    } catch (error) {
      console.error('Error saving card:', error);
    } finally {
      setAudioUploading(false);
    }
  };

  const handleEditCard = (card: Card) => {
    setCardType(card.type);
    
    if (isTextCard(card)) {
      setCardForm({
        front: card.front,
        back: card.back,
        frontAudioPath: '',
        frontAudioName: '',
        tags: card.tags,
      });
    } else if (isAudioCard(card)) {
      setCardForm({
        front: '',
        back: card.back,
        frontAudioPath: card.frontAudioPath,
        frontAudioName: card.frontAudioName,
        tags: card.tags,
      });
    } else if (isMixedCard(card)) {
      setCardForm({
        front: card.front,
        back: card.back,
        frontAudioPath: card.frontAudioPath,
        frontAudioName: card.frontAudioName,
        tags: card.tags,
      });
    }
    
    setEditingCardId(card.id);
    setShowCardForm(true);
  };

  const handleDeleteCard = async (cardId: string) => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      await deleteCard(cardId);
    }
  };

  const handleExportDeck = async () => {
    if (!deckId) return;
    
    setIsExporting(true);
    try {
      const result = await exportDeckToCSV(deckId);
      if (result.success) {
        console.log('Deck exported successfully:', result.filePath);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportToDeck = async () => {
    if (!deckId) return;
    
    setIsImporting(true);
    setImportResult(null);
    try {
      const result = await importDeckFromCSV(deckId);
      if (result.success) {
        setImportResult(result);
      }
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setIsImporting(false);
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
          
          <div className="flex items-center space-x-2">
            {/* CSV Actions for existing decks */}
            {isEditing && deckId && (
              <>
                <button
                  onClick={handleExportDeck}
                  disabled={isExporting}
                  className="btn-secondary flex items-center space-x-2"
                  title="Export this deck to CSV"
                >
                  <Download size={16} />
                  <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
                </button>
                <button
                  onClick={handleImportToDeck}
                  disabled={isImporting}
                  className="btn-secondary flex items-center space-x-2"
                  title="Import cards from CSV to this deck"
                >
                  <Upload size={16} />
                  <span>{isImporting ? 'Importing...' : 'Import CSV'}</span>
                </button>
              </>
            )}
            
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
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Import Results */}
          {importResult && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                Import Successful!
              </h4>
              <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <p>Cards imported: {importResult.imported}</p>
                {importResult.errors?.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Errors:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {importResult.errors.slice(0, 3).map((error: string, index: number) => (
                        <li key={index} className="text-xs">{error}</li>
                      ))}
                      {importResult.errors.length > 3 && (
                        <li className="text-xs">... and {importResult.errors.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              <button
                onClick={() => setImportResult(null)}
                className="mt-2 text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
              >
                Dismiss
              </button>
            </div>
          )}

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

              {/* CSV Format Info for this deck */}
              {existingCards.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>CSV Format for this deck:</strong> Front, Back, Tags, Difficulty, Interval, Study Count
                  </p>
                </div>
              )}

              {/* Card Form */}
              {showCardForm && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                    {editingCardId ? 'Edit Card' : 'New Card'}
                  </h4>
                  
                  {/* Card Type Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Card Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setCardType('text')}
                        className={`p-3 rounded-lg border transition-colors flex flex-col items-center space-y-1 ${
                          cardType === 'text'
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                      >
                        <Type size={20} />
                        <span className="text-xs font-medium">Text</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCardType('audio')}
                        className={`p-3 rounded-lg border transition-colors flex flex-col items-center space-y-1 ${
                          cardType === 'audio'
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                      >
                        <Mic size={20} />
                        <span className="text-xs font-medium">Audio</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCardType('mixed')}
                        className={`p-3 rounded-lg border transition-colors flex flex-col items-center space-y-1 ${
                          cardType === 'mixed'
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center space-x-1">
                          <Type size={14} />
                          <Mic size={14} />
                        </div>
                        <span className="text-xs font-medium">Mixed</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Text Front (for text and mixed cards) */}
                    {(cardType === 'text' || cardType === 'mixed') && (
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
                    )}
                    
                    {/* Audio Front (for audio and mixed cards) */}
                    {(cardType === 'audio' || cardType === 'mixed') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Audio File {cardType === 'mixed' ? '' : '*'}
                        </label>
                        
                        {/* Current Audio Display */}
                        {cardForm.frontAudioPath && !audioFile && (
                          <div className="mb-2">
                            <AudioPlayer
                              audioPath={cardForm.frontAudioPath}
                              audioName={cardForm.frontAudioName}
                              compact={true}
                            />
                          </div>
                        )}
                        
                        {/* New Audio File Upload */}
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={handleAudioFileSelect}
                            className="input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                          />
                          {audioFile && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Selected: {audioFile.name}
                            </p>
                          )}
                        </div>
                        
                        {/* Audio Name Field */}
                        <div className="mt-2">
                          <input
                            type="text"
                            value={cardForm.frontAudioName}
                            onChange={(e) => setCardForm({ ...cardForm, frontAudioName: e.target.value })}
                            className="input"
                            placeholder="Audio display name (optional)"
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Back (Answer) - Always present */}
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

                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      onClick={resetCardForm}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCardSubmit}
                      className="btn-primary flex items-center space-x-2"
                      disabled={
                        !cardForm.back.trim() || 
                        (cardType === 'text' && !cardForm.front.trim()) ||
                        (cardType === 'mixed' && !cardForm.front.trim()) ||
                        ((cardType === 'audio' || cardType === 'mixed') && !cardForm.frontAudioPath && !audioFile) ||
                        audioUploading
                      }
                    >
                      {audioUploading && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      )}
                      <span>{editingCardId ? 'Update Card' : 'Add Card'}</span>
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
                      <div className="flex-1">
                        {/* Card Type Indicator */}
                        <div className="flex items-center space-x-2 mb-2">
                          {isTextCard(card) && (
                            <>
                              <Type size={14} className="text-blue-600 dark:text-blue-400" />
                              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Text Card</span>
                            </>
                          )}
                          {isAudioCard(card) && (
                            <>
                              <Mic size={14} className="text-green-600 dark:text-green-400" />
                              <span className="text-xs font-medium text-green-600 dark:text-green-400">Audio Card</span>
                            </>
                          )}
                          {isMixedCard(card) && (
                            <>
                              <div className="flex items-center space-x-1">
                                <Type size={12} className="text-purple-600 dark:text-purple-400" />
                                <Mic size={12} className="text-purple-600 dark:text-purple-400" />
                              </div>
                              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Mixed Card</span>
                            </>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                              Front
                            </h5>
                            {isTextCard(card) && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 flashcard-text">
                                <LatexText text={card.front} />
                              </p>
                            )}
                            {isAudioCard(card) && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                <FileAudio size={16} />
                                <span className="truncate">{card.frontAudioName}</span>
                              </div>
                            )}
                            {isMixedCard(card) && (
                              <div className="space-y-1">
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 flashcard-text">
                                  <LatexText text={card.front} />
                                </p>
                                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-500">
                                  <FileAudio size={12} />
                                  <span className="truncate">{card.frontAudioName}</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                              Back
                            </h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 flashcard-text">
                              <LatexText text={card.back} />
                            </p>
                          </div>
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