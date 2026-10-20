import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const enabled = process.env.RUN_D1_INTEGRATION === "1";
function query(sql) {
  const output = execFileSync("npx", [
    "wrangler", "d1", "execute", "louvor-db", "--local",
    "--command", sql, "--json"
  ], { encoding: "utf8", timeout: 60000 });
  return JSON.parse(output)[0]?.results || [];
}

test("migrations D1 locais 0001 e 0002 registradas", { skip: !enabled }, () => {
  const rows = query("SELECT name FROM d1_migrations ORDER BY name");
  assert.ok(rows.some(row => row.name === "0001_initial.sql"));
  assert.ok(rows.some(row => row.name === "0002_login_attempts.sql"));
});

test("estrutura de login_attempts e restricoes preservadas", { skip: !enabled }, () => {
  const cols = query("PRAGMA table_info(login_attempts)");
  assert.deepEqual(cols.map(col => col.name), [
    "identity_hash", "failed_count", "window_started_at", "locked_until"
  ]);
  assert.equal(cols[0].pk, 1);
  const users = query("PRAGMA table_info(users)");
  assert.ok(users.some(col => col.name === "password_hash"));
  assert.ok(users.some(col => col.name === "active"));
});

test("dados sinteticos foram criados somente na base local", { skip: !enabled }, () => {
  const rows = query("SELECT email FROM users WHERE email LIKE '%@exemplo.invalid' ORDER BY email");
  assert.deepEqual(rows.map(row => row.email), [
    "admin.test@exemplo.invalid", "integrante.test@exemplo.invalid"
  ]);
  const events = query("SELECT COUNT(*) AS total FROM events WHERE event_date='2027-01-10'");
  assert.equal(Number(events[0].total), 1);
});

test("migration de login suporta escrita e exclusao locais", { skip: !enabled }, () => {
  const key = "test-migration-local-only";
  query("INSERT OR REPLACE INTO login_attempts(identity_hash,failed_count,window_started_at,locked_until) VALUES('test-migration-local-only',5,100,200)");
  const rows = query("SELECT failed_count,locked_until FROM login_attempts WHERE identity_hash='test-migration-local-only'");
  assert.equal(Number(rows[0].failed_count), 5);
  assert.equal(Number(rows[0].locked_until), 200);
  query("DELETE FROM login_attempts WHERE identity_hash='test-migration-local-only'");
});
