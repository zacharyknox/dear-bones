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
    `, (err) => {
      if (err) {
        console.error('Error creating settings table:', err);
      } else {
        // Seed database after tables are created
        seedDatabase();
      }
    });
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
      else {
        // Parse tags JSON and convert timestamps to Date objects
        const decks = rows.map((row: any) => ({
          ...row,
          tags: JSON.parse(row.tags || '[]'),
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
          cardCount: row.card_count
        }));
        resolve(decks);
      }
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

ipcMain.handle('db-update-deck', (event, id, updates) => {
  return new Promise((resolve, reject) => {
    const fields = [];
    const values = [];
    
    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.emoji !== undefined) {
      fields.push('emoji = ?');
      values.push(updates.emoji);
    }
    if (updates.tags !== undefined) {
      fields.push('tags = ?');
      values.push(JSON.stringify(updates.tags));
    }
    
    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(id);
    
    const stmt = database.prepare(`
      UPDATE decks SET ${fields.join(', ')} WHERE id = ?
    `);
    
    stmt.run(values, function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes });
    });
    
    stmt.finalize();
  });
});

ipcMain.handle('db-delete-deck', (event, id) => {
  return new Promise((resolve, reject) => {
    // Delete cards first (due to foreign key constraint)
    database.run('DELETE FROM cards WHERE deck_id = ?', [id], (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Then delete the deck
      database.run('DELETE FROM decks WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  });
});

ipcMain.handle('db-get-cards', (event, deckId) => {
  return new Promise((resolve, reject) => {
    database.all('SELECT * FROM cards WHERE deck_id = ? ORDER BY updated_at DESC', [deckId], (err, rows) => {
      if (err) reject(err);
      else {
        // Parse tags JSON and convert timestamps to Date objects
        const cards = rows.map((row: any) => ({
          ...row,
          deckId: row.deck_id,
          tags: JSON.parse(row.tags || '[]'),
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
          lastStudied: row.last_studied ? new Date(row.last_studied) : undefined,
          studyCount: row.study_count,
          easeFactor: row.ease_factor
        }));
        resolve(cards);
      }
    });
  });
});

ipcMain.handle('db-create-card', (event, card) => {
  return new Promise((resolve, reject) => {
    const stmt = database.prepare(`
      INSERT INTO cards (id, deck_id, front, back, tags, created_at, updated_at, study_count, difficulty, interval, ease_factor)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run([
      card.id,
      card.deckId,
      card.front,
      card.back,
      JSON.stringify(card.tags),
      Date.now(),
      Date.now(),
      card.studyCount || 0,
      card.difficulty || 0,
      card.interval || 1,
      card.easeFactor || 2.5
    ], function(err) {
      if (err) {
        reject(err);
        return;
      }
      
      // Update deck card count
      database.run(
        'UPDATE decks SET card_count = card_count + 1, updated_at = ? WHERE id = ?',
        [Date.now(), card.deckId],
        (err) => {
          if (err) reject(err);
          else resolve({ id: card.id });
        }
      );
    });
    
    stmt.finalize();
  });
});

ipcMain.handle('db-update-card', (event, id, updates) => {
  return new Promise((resolve, reject) => {
    const fields = [];
    const values = [];
    
    if (updates.front !== undefined) {
      fields.push('front = ?');
      values.push(updates.front);
    }
    if (updates.back !== undefined) {
      fields.push('back = ?');
      values.push(updates.back);
    }
    if (updates.tags !== undefined) {
      fields.push('tags = ?');
      values.push(JSON.stringify(updates.tags));
    }
    if (updates.lastStudied !== undefined) {
      fields.push('last_studied = ?');
      values.push(updates.lastStudied instanceof Date ? updates.lastStudied.getTime() : updates.lastStudied);
    }
    if (updates.studyCount !== undefined) {
      fields.push('study_count = ?');
      values.push(updates.studyCount);
    }
    if (updates.difficulty !== undefined) {
      fields.push('difficulty = ?');
      values.push(updates.difficulty);
    }
    if (updates.interval !== undefined) {
      fields.push('interval = ?');
      values.push(updates.interval);
    }
    if (updates.easeFactor !== undefined) {
      fields.push('ease_factor = ?');
      values.push(updates.easeFactor);
    }
    
    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(id);
    
    const stmt = database.prepare(`
      UPDATE cards SET ${fields.join(', ')} WHERE id = ?
    `);
    
    stmt.run(values, function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes });
    });
    
    stmt.finalize();
  });
});

ipcMain.handle('db-delete-card', (event, id) => {
  return new Promise((resolve, reject) => {
    // First get the deck_id to update card count
    database.get('SELECT deck_id FROM cards WHERE id = ?', [id], (err, row: any) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!row) {
        resolve({ changes: 0 });
        return;
      }
      
      const deckId = row.deck_id;
      
      // Delete the card
      database.run('DELETE FROM cards WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        // Update deck card count
        database.run(
          'UPDATE decks SET card_count = card_count - 1, updated_at = ? WHERE id = ?',
          [Date.now(), deckId],
          (err) => {
            if (err) reject(err);
            else resolve({ changes: this.changes });
          }
        );
      });
    });
  });
});

ipcMain.handle('db-get-study-sessions', (event, deckId) => {
  return new Promise((resolve, reject) => {
    const query = deckId 
      ? 'SELECT * FROM study_sessions WHERE deck_id = ? ORDER BY studied_at DESC'
      : 'SELECT * FROM study_sessions ORDER BY studied_at DESC';
    const params = deckId ? [deckId] : [];
    
    database.all(query, params, (err, rows) => {
      if (err) reject(err);
      else {
        const sessions = rows.map((row: any) => ({
          ...row,
          deckId: row.deck_id,
          cardId: row.card_id,
          responseTime: row.response_time,
          studiedAt: new Date(row.studied_at)
        }));
        resolve(sessions);
      }
    });
  });
});

ipcMain.handle('db-create-study-session', (event, session) => {
  return new Promise((resolve, reject) => {
    const stmt = database.prepare(`
      INSERT INTO study_sessions (id, deck_id, card_id, confidence, response_time, studied_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run([
      session.id,
      session.deckId,
      session.cardId,
      session.confidence,
      session.responseTime,
      Date.now()
    ], function(err) {
      if (err) reject(err);
      else resolve({ id: session.id });
    });
    
    stmt.finalize();
  });
});

ipcMain.handle('db-get-settings', () => {
  return new Promise((resolve, reject) => {
    database.all('SELECT * FROM settings', (err, rows) => {
      if (err) reject(err);
      else {
        const settings: Record<string, any> = {};
        rows.forEach((row: any) => {
          try {
            settings[row.key] = JSON.parse(row.value);
          } catch {
            settings[row.key] = row.value;
          }
        });
        resolve(settings);
      }
    });
  });
});

ipcMain.handle('db-update-setting', (event, key, value) => {
  return new Promise((resolve, reject) => {
    const stmt = database.prepare(`
      INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)
    `);
    
    stmt.run([key, JSON.stringify(value)], function(err) {
      if (err) reject(err);
      else resolve({ key, value });
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

ipcMain.handle('import-data', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: [
      { name: 'JSON Files', extensions: ['json'] }
    ],
    properties: ['openFile']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    // TODO: Implement import logic
    return result.filePaths[0];
  }
  return null;
});

// Seed database with sample data if empty
const seedDatabase = (): void => {
  database.get('SELECT COUNT(*) as count FROM decks', (err, row: any) => {
    if (err) {
      console.error('Error checking deck count:', err);
      return;
    }

    if (row.count === 0) {
      console.log('Seeding database with sample data...');
      
      const sampleDecks = [
        {
          id: '1',
          name: 'Spanish Vocabulary',
          description: 'Essential Spanish words and phrases',
          emoji: '🇪🇸',
          tags: ['language', 'spanish'],
        },
        {
          id: '2',
          name: 'Biology Terms',
          description: 'Key concepts in biology',
          emoji: '🧬',
          tags: ['science', 'biology'],
        },
      ];

      const sampleCards = [
        {
          id: '1',
          deckId: '1',
          front: 'Hello',
          back: 'Hola',
          tags: ['greetings'],
        },
        {
          id: '2',
          deckId: '1',
          front: 'Thank you',
          back: 'Gracias',
          tags: ['greetings'],
        },
        {
          id: '3',
          deckId: '1',
          front: 'Goodbye',
          back: 'Adiós',
          tags: ['greetings'],
        },
        {
          id: '4',
          deckId: '2',
          front: 'Cell',
          back: 'The basic unit of life',
          tags: ['basic'],
        },
        {
          id: '5',
          deckId: '2',
          front: 'DNA',
          back: 'Deoxyribonucleic acid - carries genetic information',
          tags: ['genetics'],
        },
      ];

      // Insert sample decks
      const deckStmt = database.prepare(`
        INSERT INTO decks (id, name, description, emoji, tags, created_at, updated_at, card_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      sampleDecks.forEach(deck => {
        const cardCount = sampleCards.filter(card => card.deckId === deck.id).length;
        deckStmt.run([
          deck.id,
          deck.name,
          deck.description,
          deck.emoji,
          JSON.stringify(deck.tags),
          Date.now(),
          Date.now(),
          cardCount
        ]);
      });
      deckStmt.finalize();

      // Insert sample cards
      const cardStmt = database.prepare(`
        INSERT INTO cards (id, deck_id, front, back, tags, created_at, updated_at, study_count, difficulty, interval, ease_factor)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      sampleCards.forEach(card => {
        cardStmt.run([
          card.id,
          card.deckId,
          card.front,
          card.back,
          JSON.stringify(card.tags),
          Date.now(),
          Date.now(),
          0,
          0,
          1,
          2.5
        ]);
      });
      cardStmt.finalize();

      console.log('Sample data seeded successfully');
    }
  });
};

app.on('before-quit', () => {
  if (database) {
    database.close();
  }
}); 