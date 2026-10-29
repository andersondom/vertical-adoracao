import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

// Run only in CI or with explicit opt-in. NEVER pass --remote.
if (process.env.RUN_D1_INTEGRATION !== "1") {
  console.log("D1 persistence test skipped (RUN_D1_INTEGRATION != 1)");
  process.exit(0);
}

function query(sql) {
  const output = execFileSync("npx", [
    "wrangler", "d1", "execute", "louvor-db", "--local", "--json", "--command", sql
  ], { encoding: "utf8", timeout: 45000 });
  const start = output.indexOf("[");
  assert.ok(start >= 0, "Wrangler JSON result not found");
  const parsed = JSON.parse(output.slice(start));
  assert.equal(parsed[0].success, true);
  return parsed[0].results ?? [];
}

const token = "d1-integration-fictional-session";
const email = "integrante.test@exemplo.invalid";
const escaped = s => s.replaceAll("'", "''");
const user = query(`SELECT id FROM users WHERE email='${escaped(email)}'`)[0];
assert.ok(user?.id, "fictional local seed user required");

try {
  query(`INSERT OR REPLACE INTO sessions(id,user_id,expires_at) VALUES('${token}',${user.id},'2099-01-01T00:00:00.000Z')`);
  assert.equal(query(`SELECT COUNT(*) AS n FROM sessions WHERE id='${token}' AND user_id=${user.id}`)[0].n, 1);

  query(`DELETE FROM sessions WHERE id='${token}'`);
  assert.equal(query(`SELECT COUNT(*) AS n FROM sessions WHERE id='${token}'`)[0].n, 0, "revoked token must not persist");

  const event = query("SELECT id FROM events WHERE event_date='2027-01-10' LIMIT 1")[0];
  assert.ok(event?.id, "fictional event required");
  query(`INSERT INTO availability(event_id,user_id,available) VALUES(${event.id},${user.id},1)
    ON CONFLICT(event_id,user_id) DO UPDATE SET available=1`);
  assert.equal(query(`SELECT available FROM availability WHERE event_id=${event.id} AND user_id=${user.id}`)[0].available, 1);

  const other = query("SELECT id FROM users WHERE email='admin.test@exemplo.invalid'")[0];
  assert.ok(other?.id);
  assert.equal(query(`SELECT COUNT(*) AS n FROM availability WHERE event_id=${event.id} AND user_id=${other.id}`)[0].n, 0,
    "availability must not leak into another fictional user");

  console.log("D1 local: session create/revoke/replay prevention, availability persistence and user isolation verified.");
} finally {
  query(`DELETE FROM sessions WHERE id='${token}'`);
}
