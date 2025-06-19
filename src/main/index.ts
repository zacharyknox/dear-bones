import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { Database } from 'sqlite3';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow;
let database: Database;

const createWindow = (): void => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    minHeight: 600,
    minWidth: 800,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load the app.
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:9000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
};

const initDatabase = (): void => {
  const dbPath = path.join(app.getPath('userData'), 'dear-bones.db');
  database = new Database(dbPath);

  // Create tables if they don't exist
  database.serialize(() => {
    database.run(`
      CREATE TABLE IF NOT EXISTS decks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        emoji TEXT,
        tags TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        card_count INTEGER DEFAULT 0
      )
    `);

    database.run(`
      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        deck_id TEXT NOT NULL,
        front TEXT NOT NULL,
        back TEXT NOT NULL,
        tags TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        last_studied INTEGER,
        study_count INTEGER DEFAULT 0,
        difficulty REAL DEFAULT 0,
        interval INTEGER DEFAULT 1,
        ease_factor REAL DEFAULT 2.5,
        FOREIGN KEY (deck_id) REFERENCES decks (id) ON DELETE CASCADE
      )
    `);

    database.run(`
      CREATE TABLE IF NOT EXISTS study_sessions (
        id TEXT PRIMARY KEY,
        deck_id TEXT NOT NULL,
        card_id TEXT NOT NULL,
        confidence INTEGER NOT NULL,
        response_time INTEGER NOT NULL,
        studied_at INTEGER NOT NULL,
        FOREIGN KEY (deck_id) REFERENCES decks (id) ON DELETE CASCADE,
        FOREIGN KEY (card_id) REFERENCES cards (id) ON DELETE CASCADE
      )
    `);

    database.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
  });
};

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();
  initDatabase();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Database IPC handlers
ipcMain.handle('db-get-decks', () => {
  return new Promise((resolve, reject) => {
    database.all('SELECT * FROM decks ORDER BY updated_at DESC', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

ipcMain.handle('db-create-deck', (event, deck) => {
  return new Promise((resolve, reject) => {
    const stmt = database.prepare(`
      INSERT INTO decks (id, name, description, emoji, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run([
      deck.id,
      deck.name,
      deck.description,
      deck.emoji,
      JSON.stringify(deck.tags),
      Date.now(),
      Date.now()
    ], function(err) {
      if (err) reject(err);
      else resolve({ id: deck.id });
    });
    
    stmt.finalize();
  });
});

// Export/Import handlers
ipcMain.handle('export-data', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: 'dear-bones-export.json',
    filters: [
      { name: 'JSON Files', extensions: ['json'] }
    ]
  });

  if (!result.canceled && result.filePath) {
    // TODO: Implement export logic
    return result.filePath;
  }
  return null;
});

app.on('before-quit', () => {
  if (database) {
    database.close();
  }
}); 