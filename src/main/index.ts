import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { Database } from 'sqlite3';
import * as fs from 'fs/promises';

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

// CSV Utility Functions
const parseCSVRow = (row: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < row.length) {
    const char = row[i];
    const nextChar = row[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }

  result.push(current.trim());
  return result;
};

const generateCSVData = async (deckId?: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const query = deckId 
      ? `SELECT c.*, d.name as deck_name, d.emoji as deck_emoji 
         FROM cards c JOIN decks d ON c.deck_id = d.id 
         WHERE c.deck_id = ? 
         ORDER BY c.created_at`
      : `SELECT c.*, d.name as deck_name, d.emoji as deck_emoji 
         FROM cards c JOIN decks d ON c.deck_id = d.id 
         ORDER BY d.name, c.created_at`;
    
    const params = deckId ? [deckId] : [];
    
    database.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      const csvRows: string[] = [];
      
      // Header row
      if (deckId) {
        csvRows.push('Front,Back,Tags,Difficulty,Interval,Study Count');
      } else {
        csvRows.push('Deck Name,Deck Emoji,Front,Back,Tags,Difficulty,Interval,Study Count');
      }
      
      // Data rows
      rows.forEach((row: any) => {
        const tags = JSON.parse(row.tags || '[]').join(';');
        const csvRow = deckId 
          ? [row.front, row.back, tags, row.difficulty.toString(), row.interval.toString(), row.study_count.toString()]
          : [row.deck_name, row.deck_emoji || '', row.front, row.back, tags, row.difficulty.toString(), row.interval.toString(), row.study_count.toString()];
        
        // Escape quotes and wrap fields with commas or quotes in quotes
        const escapedRow = csvRow.map(field => {
          const str = String(field);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        });
        
        csvRows.push(escapedRow.join(','));
      });
      
      resolve(csvRows.join('\n'));
    });
  });
};

const parseAndImportCSV = async (filePath: string, targetDeckId?: string): Promise<any> => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header and one data row');
    }
    
    const headers = parseCSVRow(lines[0]).map(h => h.toLowerCase().trim());
    const results = {
      success: true,
      imported: 0,
      errors: [] as string[],
      decksCreated: [] as string[]
    };
    
    // Validate required headers
    const frontIndex = headers.findIndex(h => h.includes('front'));
    const backIndex = headers.findIndex(h => h.includes('back'));
    
    if (frontIndex === -1 || backIndex === -1) {
      throw new Error('CSV must contain Front and Back columns');
    }
    
    const tagsIndex = headers.findIndex(h => h.includes('tag'));
    const deckNameIndex = headers.findIndex(h => h.includes('deck') && h.includes('name'));
    const deckEmojiIndex = headers.findIndex(h => h.includes('deck') && h.includes('emoji'));
    const difficultyIndex = headers.findIndex(h => h.includes('difficulty'));
    const intervalIndex = headers.findIndex(h => h.includes('interval'));
    const studyCountIndex = headers.findIndex(h => h.includes('study') && h.includes('count'));
    
    // Process each row
    for (let i = 1; i < lines.length; i++) {
      try {
        const row = parseCSVRow(lines[i]);
        
        if (row.length < Math.max(frontIndex, backIndex) + 1) {
          results.errors.push(`Row ${i + 1}: Insufficient columns`);
          continue;
        }
        
        const front = row[frontIndex]?.trim();
        const back = row[backIndex]?.trim();
        
        if (!front || !back) {
          results.errors.push(`Row ${i + 1}: Front and Back are required`);
          continue;
        }
        
        // Determine target deck
        let deckId = targetDeckId;
        
        if (!deckId && deckNameIndex >= 0) {
          const deckName = row[deckNameIndex]?.trim();
          if (deckName) {
            deckId = await findOrCreateDeck(deckName, row[deckEmojiIndex]?.trim() || '📚', results);
          } else {
            results.errors.push(`Row ${i + 1}: No deck specified`);
            continue;
          }
        } else if (!deckId) {
          results.errors.push(`Row ${i + 1}: No target deck specified`);
          continue;
        }
        
        // Parse tags
        const tags = tagsIndex >= 0 ? (row[tagsIndex]?.split(';').filter(t => t.trim()) || []) : [];
        
        // Parse optional fields
        const difficulty = difficultyIndex >= 0 ? parseFloat(row[difficultyIndex]) || 0 : 0;
        const interval = intervalIndex >= 0 ? parseInt(row[intervalIndex]) || 1 : 1;
        const studyCount = studyCountIndex >= 0 ? parseInt(row[studyCountIndex]) || 0 : 0;
        
        // Create card
        await createCardFromImport(deckId, front, back, tags, difficulty, interval, studyCount);
        results.imported++;
        
      } catch (error) {
        results.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return results;
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import CSV'
    };
  }
};

const findOrCreateDeck = async (name: string, emoji: string, results: any): Promise<string> => {
  return new Promise((resolve, reject) => {
    // First try to find existing deck
    database.get('SELECT id FROM decks WHERE name = ?', [name], (err, row: any) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (row) {
        resolve(row.id);
        return;
      }
      
      // Create new deck
      const deckId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
      const stmt = database.prepare(`
        INSERT INTO decks (id, name, description, emoji, tags, created_at, updated_at, card_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run([
        deckId,
        name,
        `Imported from CSV`,
        emoji,
        JSON.stringify([]),
        Date.now(),
        Date.now(),
        0
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          results.decksCreated.push(name);
          resolve(deckId);
        }
      });
      
      stmt.finalize();
    });
  });
};

const createCardFromImport = async (deckId: string, front: string, back: string, tags: string[], difficulty: number, interval: number, studyCount: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    const cardId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    const stmt = database.prepare(`
      INSERT INTO cards (id, deck_id, front, back, tags, created_at, updated_at, study_count, difficulty, interval, ease_factor)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run([
      cardId,
      deckId,
      front,
      back,
      JSON.stringify(tags),
      Date.now(),
      Date.now(),
      studyCount,
      difficulty,
      interval,
      2.5 // Default ease factor
    ], function(err) {
      if (err) {
        reject(err);
        return;
      }
      
      // Update deck card count
      database.run(
        'UPDATE decks SET card_count = card_count + 1, updated_at = ? WHERE id = ?',
        [Date.now(), deckId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    stmt.finalize();
  });
};

// Export/Import handlers
ipcMain.handle('export-csv', async (event, deckId?: string) => {
  try {
    const deckName = deckId ? await getDeckName(deckId) : 'all-decks';
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: `${deckName}.csv`,
      filters: [
        { name: 'CSV Files', extensions: ['csv'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePath) {
      try {
        const csvData = await generateCSVData(deckId);
        await fs.writeFile(result.filePath, csvData, 'utf-8');
        return { success: true, filePath: result.filePath };
      } catch (error) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to export CSV' 
        };
      }
    }
    return { success: false, error: 'Export cancelled' };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Export failed' 
    };
  }
});

ipcMain.handle('import-csv', async (event, targetDeckId?: string) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      filters: [
        { name: 'CSV Files', extensions: ['csv'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const importResult = await parseAndImportCSV(result.filePaths[0], targetDeckId);
      return importResult;
    }
    return { success: false, error: 'Import cancelled' };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Import failed' 
    };
  }
});

const getDeckName = async (deckId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    database.get('SELECT name FROM decks WHERE id = ?', [deckId], (err, row: any) => {
      if (err) {
        reject(err);
      } else if (row) {
        // Replace spaces and special characters for filename
        const safeName = row.name.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        resolve(safeName || 'deck');
      } else {
        resolve('deck');
      }
    });
  });
};

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