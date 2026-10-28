-- Módulo 3: registros de presença sem modificar dados históricos.
CREATE TABLE IF NOT EXISTS event_attendance_closures (
  event_id INTEGER PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','closed')),
  closed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  closed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS event_attendance (
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK(status IN ('present','absent_justified','absent_unjustified')),
  justification TEXT,
  updated_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(event_id,user_id)
);
CREATE TABLE IF NOT EXISTS event_attendance_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  previous_justification TEXT,
  new_justification TEXT,
  reason TEXT NOT NULL,
  actor_user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON event_attendance(user_id,event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_history_event ON event_attendance_history(event_id,created_at);
