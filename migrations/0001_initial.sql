PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin','member')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS schedule_settings (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  month_label TEXT NOT NULL DEFAULT 'Setembro de 2026',
  availability_open INTEGER NOT NULL DEFAULT 1
);

INSERT OR IGNORE INTO schedule_settings(id, month_label, availability_open)
VALUES (1, 'Setembro de 2026', 1);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_date TEXT NOT NULL UNIQUE,
  day_code TEXT NOT NULL,
  title TEXT,
  icon TEXT NOT NULL DEFAULT '🎶',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS availability (
  event_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  available INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(event_id, user_id),
  FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assignments (
  event_id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_user_id INTEGER,
  action TEXT NOT NULL,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(actor_user_id) REFERENCES users(id) ON DELETE SET NULL
);

INSERT OR IGNORE INTO events(event_date, day_code, title, icon) VALUES
('2026-09-02','Q',NULL,'🎸'),
('2026-09-06','D',NULL,'🙏'),
('2026-09-09','Q',NULL,'🎤'),
('2026-09-12','S','Rede Atos','🔥'),
('2026-09-13','D',NULL,'🙏'),
('2026-09-16','Q',NULL,'🎶'),
('2026-09-19','S',NULL,'🎤'),
('2026-09-20','D',NULL,'🙏'),
('2026-09-23','Q',NULL,'🥁'),
('2026-09-25','Sx','Festa dos Tabernáculos','⛺'),
('2026-09-26','S','Festa dos Tabernáculos','⛺'),
('2026-09-27','D','Festa dos Tabernáculos','⛺'),
('2026-09-30','Q',NULL,'🎶');
