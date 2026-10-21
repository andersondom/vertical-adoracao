import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const initial = readFileSync(new URL('../migrations/0001_initial.sql', import.meta.url),'utf8');
const migration = readFileSync(new URL('../migrations/0003_team_foundation.sql', import.meta.url),'utf8');

test('migração do módulo 2 preserva escala legada e cria funções e equipes', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(initial);
    db.exec("INSERT INTO users(name,email,password_hash,password_salt) VALUES('Teste','teste@example.com','x','y')");
    const userId = db.prepare("SELECT id FROM users WHERE email='teste@example.com'").get().id;
    const eventId = db.prepare("SELECT id FROM events LIMIT 1").get().id;
    db.prepare("INSERT INTO assignments(event_id,user_id) VALUES(?,?)").run(eventId,userId);
    db.exec(migration);
    assert.equal(db.prepare('SELECT user_id FROM assignments WHERE event_id=?').get(eventId).user_id,userId);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM ministry_roles').get().n,3);
    const roleId = db.prepare("SELECT id FROM ministry_roles WHERE code='vocal'").get().id;
    db.prepare('INSERT INTO member_roles(user_id,role_id) VALUES(?,?)').run(userId,roleId);
    db.prepare('INSERT INTO team_assignments(event_id,user_id,role_id,status,is_leader) VALUES(?,?,?,?,?)').run(eventId,userId,roleId,'confirmed',1);
    assert.throws(()=>db.prepare('INSERT INTO team_assignments(event_id,user_id,role_id,status,is_leader) VALUES(?,?,?,?,?)').run(eventId,userId,db.prepare("SELECT id FROM ministry_roles WHERE code='leader'").get().id,'reserved',1),/UNIQUE/);
    assert.throws(()=>db.prepare('INSERT INTO event_role_requirements(event_id,role_id,slots) VALUES(?,?,?)').run(eventId,roleId,-1),/CHECK/);
  } finally { db.close(); }
});

test('migrações 0001, 0002 e 0003 são aplicáveis em sequência', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(initial);
    db.exec(readFileSync(new URL('../migrations/0002_login_attempts.sql', import.meta.url),'utf8'));
    db.exec(migration);
    const names = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('login_attempts','ministry_roles','member_roles','event_role_requirements','team_assignments') ORDER BY name").all().map(x=>x.name);
    assert.deepEqual(names,['event_role_requirements','login_attempts','member_roles','ministry_roles','team_assignments']);
  } finally { db.close(); }
});

test('integridade referencial e restrições de estados de equipe', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec('PRAGMA foreign_keys=ON;');
    db.exec(initial);
    db.exec(migration);
    const eventId = db.prepare('SELECT id FROM events LIMIT 1').get().id;
    const roleId = db.prepare("SELECT id FROM ministry_roles WHERE code='vocal'").get().id;
    assert.throws(()=>db.prepare('INSERT INTO member_roles(user_id,role_id) VALUES(?,?)').run(999999,roleId),/FOREIGN KEY/);
    assert.throws(()=>db.prepare('INSERT INTO team_assignments(event_id,user_id,role_id,status,is_leader) VALUES(?,?,?,?,?)').run(eventId,999999,roleId,'reserved',0),/FOREIGN KEY/);
    db.prepare("INSERT INTO users(name,email,password_hash,password_salt) VALUES('Pessoa','pessoa@example.com','x','y')").run();
    const userId=db.prepare("SELECT id FROM users WHERE email='pessoa@example.com'").get().id;
    assert.throws(()=>db.prepare('INSERT INTO team_assignments(event_id,user_id,role_id,status,is_leader) VALUES(?,?,?,?,?)').run(eventId,userId,roleId,'published',0),/CHECK/);
  } finally { db.close(); }
});
