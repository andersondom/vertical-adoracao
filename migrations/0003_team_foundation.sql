-- Módulo 2: estruturas incrementais. Não altera assignments legadas.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS ministry_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1))
);

INSERT OR IGNORE INTO ministry_roles(code,label) VALUES
('vocal','Vocal'),('instrument','Instrumento'),('leader','Liderança');

CREATE TABLE IF NOT EXISTS member_roles (
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  PRIMARY KEY(user_id,role_id),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(role_id) REFERENCES ministry_roles(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS event_role_requirements (
  event_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  slots INTEGER NOT NULL DEFAULT 1 CHECK(slots BETWEEN 0 AND 50),
  PRIMARY KEY(event_id,role_id),
  FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY(role_id) REFERENCES ministry_roles(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS team_assignments (
  event_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK(status IN ('proposed','reserved','confirmed','declined')),
  is_leader INTEGER NOT NULL DEFAULT 0 CHECK(is_leader IN (0,1)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(event_id,user_id,role_id),
  FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY(role_id) REFERENCES ministry_roles(id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_team_leader_per_event
ON team_assignments(event_id) WHERE is_leader=1 AND status IN ('reserved','confirmed');

CREATE INDEX IF NOT EXISTS idx_team_assignments_user ON team_assignments(user_id,event_id);
