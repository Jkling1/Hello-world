import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'

export type DB = Database.Database

let db: DB | null = null

export function getDb(): DB {
  if (!db) {
    const dbPath = process.env.VANTAGE_DB_PATH || path.join(process.cwd(), 'data', 'vantage.db')
    if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(dbPath), { recursive: true })
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    migrate(db)
  }
  return db
}

/** For tests: fresh in-memory database. */
export function createTestDb(): DB {
  const mem = new Database(':memory:')
  mem.pragma('foreign_keys = ON')
  migrate(mem)
  return mem
}

export function closeDb(): void {
  db?.close()
  db = null
}

function migrate(d: DB): void {
  d.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL,
    email TEXT,
    location TEXT,
    race_name TEXT NOT NULL DEFAULT 'Ironman Florida',
    race_date TEXT NOT NULL DEFAULT '2026-11-07',
    program_start TEXT NOT NULL DEFAULT '2025-12-01',
    persona_notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('run','swim','bike','strength','brick','mobility','other')),
    title TEXT,
    duration_min REAL NOT NULL,
    distance_km REAL,
    effort INTEGER,
    zones TEXT NOT NULL DEFAULT '[]',
    feeling TEXT NOT NULL,
    notes TEXT,
    source TEXT NOT NULL DEFAULT 'manual',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date);

  CREATE TABLE IF NOT EXISTS daily_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    fatigue INTEGER,
    mood INTEGER,
    sleep_hours REAL,
    adherence REAL,
    missed_workout INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    source TEXT NOT NULL DEFAULT 'manual'
  );

  CREATE TABLE IF NOT EXISTS protocols (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    protocol_json TEXT NOT NULL,
    markdown TEXT NOT NULL,
    state_json TEXT NOT NULL DEFAULT '{}',
    generated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS life_systems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    day_of_week INTEGER,
    cadence TEXT NOT NULL DEFAULT 'weekly',
    category TEXT NOT NULL DEFAULT 'Business',
    active INTEGER NOT NULL DEFAULT 1,
    source TEXT NOT NULL DEFAULT 'manual'
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Fitness',
    cadence TEXT NOT NULL DEFAULT 'daily',
    big_rock INTEGER NOT NULL DEFAULT 0,
    completed INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    origin TEXT NOT NULL DEFAULT 'manual',
    life_system_id INTEGER REFERENCES life_systems(id) ON DELETE SET NULL,
    source TEXT NOT NULL DEFAULT 'manual',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);

  CREATE TABLE IF NOT EXISTS journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    mood INTEGER,
    content TEXT NOT NULL DEFAULT '',
    prompts_json TEXT NOT NULL DEFAULT '[]',
    voice_transcript TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    source TEXT NOT NULL DEFAULT 'manual',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_entries(date);

  CREATE VIRTUAL TABLE IF NOT EXISTS journal_fts USING fts5(
    content, voice_transcript, content='journal_entries', content_rowid='id'
  );
  CREATE TRIGGER IF NOT EXISTS journal_ai AFTER INSERT ON journal_entries BEGIN
    INSERT INTO journal_fts(rowid, content, voice_transcript)
    VALUES (new.id, new.content, coalesce(new.voice_transcript,''));
  END;
  CREATE TRIGGER IF NOT EXISTS journal_ad AFTER DELETE ON journal_entries BEGIN
    INSERT INTO journal_fts(journal_fts, rowid, content, voice_transcript)
    VALUES ('delete', old.id, old.content, coalesce(old.voice_transcript,''));
  END;
  CREATE TRIGGER IF NOT EXISTS journal_au AFTER UPDATE ON journal_entries BEGIN
    INSERT INTO journal_fts(journal_fts, rowid, content, voice_transcript)
    VALUES ('delete', old.id, old.content, coalesce(old.voice_transcript,''));
    INSERT INTO journal_fts(rowid, content, voice_transcript)
    VALUES (new.id, new.content, coalesce(new.voice_transcript,''));
  END;

  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT,
    total_pages INTEGER,
    current_page INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','finished','abandoned')),
    rating INTEGER,
    review TEXT,
    started_at TEXT,
    finished_at TEXT,
    source TEXT NOT NULL DEFAULT 'manual'
  );

  CREATE TABLE IF NOT EXISTS book_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    kind TEXT NOT NULL DEFAULT 'note' CHECK (kind IN ('note','quote','takeaway')),
    content TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',
    page INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    target_date TEXT,
    completed INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    source TEXT NOT NULL DEFAULT 'manual'
  );

  CREATE TABLE IF NOT EXISTS budget_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    planned_cents INTEGER NOT NULL DEFAULT 0,
    spent_cents INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    source TEXT NOT NULL DEFAULT 'manual'
  );

  CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL DEFAULT '🏅',
    unlocked_at TEXT
  );

  CREATE TABLE IF NOT EXISTS coach_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL DEFAULT 'New conversation',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS coach_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL REFERENCES coach_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user','assistant')),
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS coach_memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'fact' CHECK (category IN ('intention','preference','concern','fact','win')),
    salience INTEGER NOT NULL DEFAULT 5,
    source TEXT NOT NULL DEFAULT 'chat',
    source_message_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_referenced_at TEXT,
    archived INTEGER NOT NULL DEFAULT 0
  );
  `)

  // Default achievement catalog (locked until earned)
  const insertAch = d.prepare(
    `INSERT OR IGNORE INTO achievements (code, title, description, icon) VALUES (?, ?, ?, ?)`,
  )
  const catalog: [string, string, string, string][] = [
    ['first_workout', 'First Blood', 'Logged your first workout', '🩸'],
    ['streak_7', 'Unbroken Week', '7-day training streak', '🔥'],
    ['streak_30', 'Unbreakable Month', '30-day training streak', '⚡'],
    ['week_100km', 'Century Week', '100km combined volume in one week', '💯'],
    ['first_brick', 'Brick by Brick', 'Completed your first brick session', '🧱'],
    ['first_book_note', 'Scholar Athlete', 'Captured your first book takeaway', '📚'],
    ['book_finished', 'Closed the Cover', 'Finished a book', '🎓'],
    ['journal_streak_7', 'Know Thyself', 'Journaled 7 days in a row', '🪞'],
    ['half_iron', '70.3 Finisher', 'Completed the Rockford Ironman 70.3', '🥈'],
    ['marathon', 'Marathoner', 'Completed the Chicago Marathon', '🏃'],
    ['ow_swim', 'Open Water', 'Completed a 2.4-mile open water swim', '🌊'],
    ['century_ride', 'Century Rider', 'Completed a 112-mile ride', '🚴'],
    ['budget_funded', 'Fully Funded', 'Budget Reactor at 100%', '💰'],
    ['race_ready', 'Race Ready', 'All roadmap milestones complete', '🏁'],
  ]
  for (const a of catalog) insertAch.run(...a)

  // Default profile
  d.prepare(
    `INSERT OR IGNORE INTO profile (id, name, email, location, persona_notes)
     VALUES (1, 'Jordan Kling', 'jordankling@gmail.com', 'Loves Park / Rockford, Illinois', '')`,
  ).run()

  // Fixed-day life systems
  const ls = d.prepare(
    `INSERT INTO life_systems (name, day_of_week, cadence, category, source)
     SELECT ?, ?, 'weekly', ?, 'seed'
     WHERE NOT EXISTS (SELECT 1 FROM life_systems WHERE name = ?)`,
  )
  ls.run('Weekly Money Review', 1, 'Money', 'Weekly Money Review')
  ls.run('Environment Reset', 6, 'Mindset', 'Environment Reset')
  ls.run('Weekly Planning', 0, 'Business', 'Weekly Planning')
}
