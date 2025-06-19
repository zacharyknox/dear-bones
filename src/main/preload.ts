import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  getDecks: () => ipcRenderer.invoke('db-get-decks'),
  createDeck: (deck: any) => ipcRenderer.invoke('db-create-deck', deck),
  updateDeck: (id: string, updates: any) => ipcRenderer.invoke('db-update-deck', id, updates),
  deleteDeck: (id: string) => ipcRenderer.invoke('db-delete-deck', id),
  
  getCards: (deckId: string) => ipcRenderer.invoke('db-get-cards', deckId),
  createCard: (card: any) => ipcRenderer.invoke('db-create-card', card),
  updateCard: (id: string, updates: any) => ipcRenderer.invoke('db-update-card', id, updates),
  deleteCard: (id: string) => ipcRenderer.invoke('db-delete-card', id),
  
  getStudySessions: (deckId?: string) => ipcRenderer.invoke('db-get-study-sessions', deckId),
  createStudySession: (session: any) => ipcRenderer.invoke('db-create-study-session', session),
  
  getSettings: () => ipcRenderer.invoke('db-get-settings'),
  updateSetting: (key: string, value: any) => ipcRenderer.invoke('db-update-setting', key, value),
  
  // File operations
  exportData: () => ipcRenderer.invoke('export-data'),
  importData: () => ipcRenderer.invoke('import-data'),
}); 