import React, { useState } from 'react';
import { Moon, Sun, Monitor, Download, Upload } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import type { Theme } from '../../types';

interface SettingsViewProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export function SettingsView({ theme, onThemeChange }: SettingsViewProps) {
  const { settings, updateSettings, exportDeckToCSV, importDeckFromCSV } = useAppStore();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const handleSettingChange = async (key: keyof typeof settings, value: any) => {
    await updateSettings({ [key]: value });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportDeckToCSV();
      if (result.success) {
        // Show success message - could be enhanced with a toast system
        console.log('Export successful:', result.filePath);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    setImportResult(null);
    try {
      const result = await importDeckFromCSV();
      if (result.success) {
        setImportResult(result);
      }
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const themeOptions = [
    { value: 'light' as Theme, label: 'Light', icon: Sun },
    { value: 'dark' as Theme, label: 'Dark', icon: Moon },
    { value: 'system' as Theme, label: 'System', icon: Monitor },
  ];

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Settings
        </h2>

        <div className="space-y-6">
          {/* Appearance */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Appearance
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {themeOptions.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => onThemeChange(value)}
                      className={`flex flex-col items-center p-3 rounded-lg border-2 transition-colors ${
                        theme === value
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <Icon size={20} className="mb-2" />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Study Settings */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Study Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Study Mode
                </label>
                <select
                  value={settings.studyMode}
                  onChange={(e) => handleSettingChange('studyMode', e.target.value)}
                  className="input"
                >
                  <option value="standard">Standard Review</option>
                  <option value="spaced-repetition">Spaced Repetition</option>
                  <option value="shuffle">Shuffle Mode</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cards per Session
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.cardsPerSession}
                  onChange={(e) => handleSettingChange('cardsPerSession', parseInt(e.target.value))}
                  className="input"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Show Timer
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Display study timer during sessions
                  </p>
                </div>
                <button
                  onClick={() => handleSettingChange('showTimer', !settings.showTimer)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.showTimer ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.showTimer ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enable Sounds
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Play sounds during study sessions
                  </p>
                </div>
                <button
                  onClick={() => handleSettingChange('enableSounds', !settings.enableSounds)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.enableSounds ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.enableSounds ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Data Import/Export */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Data Management
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Export your flashcard decks to CSV format or import cards from CSV files.
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Download size={16} />
                    <span>{isExporting ? 'Exporting...' : 'Export All Decks'}</span>
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={isImporting}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Upload size={16} />
                    <span>{isImporting ? 'Importing...' : 'Import from CSV'}</span>
                  </button>
                </div>
              </div>

              {/* Import Results */}
              {importResult && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                    Import Successful!
                  </h4>
                  <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <p>Cards imported: {importResult.imported}</p>
                    {importResult.decksCreated?.length > 0 && (
                      <p>New decks created: {importResult.decksCreated.join(', ')}</p>
                    )}
                    {importResult.errors?.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium">Errors:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {importResult.errors.slice(0, 5).map((error: string, index: number) => (
                            <li key={index} className="text-xs">{error}</li>
                          ))}
                          {importResult.errors.length > 5 && (
                            <li className="text-xs">... and {importResult.errors.length - 5} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p className="mb-2"><strong>CSV Format:</strong></p>
                <p>• Single deck: Front, Back, Tags, Difficulty, Interval, Study Count</p>
                <p>• Multiple decks: Deck Name, Deck Emoji, Front, Back, Tags, Difficulty, Interval, Study Count</p>
                <p>• Tags should be separated by semicolons (;)</p>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              About
            </h3>
            
            <div className="text-center">
              <div className="text-4xl mb-4">💀</div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Dear Bones
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                A minimalist flashcards application for effective learning
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Version 1.0.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 