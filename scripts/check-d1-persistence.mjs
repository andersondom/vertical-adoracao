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

  // Exercise a real availability state transition without touching any remote database.
  query(`DELETE FROM availability WHERE event_id=${event.id} AND user_id=${user.id}`);
  assert.equal(query(`SELECT COUNT(*) AS n FROM availability WHERE event_id=${event.id} AND user_id=${user.id}`)[0].n, 0,
    "withdrawn availability must no longer exist");
  query(`INSERT INTO availability(event_id,user_id,available) VALUES(${event.id},${user.id},1)`);
  assert.equal(query(`SELECT available FROM availability WHERE event_id=${event.id} AND user_id=${user.id}`)[0].available, 1,
    "availability must be restorable after withdrawal");

  const auditAction = "D1_INTEGRATION_TEST";
  query(`INSERT INTO audit_log(actor_user_id,action,details) VALUES(${user.id},'${auditAction}','fictional local-only transition')`);
  assert.equal(query(`SELECT COUNT(*) AS n FROM audit_log WHERE actor_user_id=${user.id} AND action='${auditAction}'`)[0].n, 1,
    "audit event must persist in local D1");
  query(`DELETE FROM audit_log WHERE actor_user_id=${user.id} AND action='${auditAction}'`);

  // Exercise the persisted assignment lifecycle using the seeded fictional event/member.
  const role = query("SELECT id FROM ministry_roles WHERE active=1 ORDER BY id LIMIT 1")[0];
  assert.ok(role?.id, "an active ministry role is required in local migrations");
  query(`INSERT INTO team_assignments(event_id,user_id,role_id,status,is_leader)
    VALUES(${event.id},${user.id},${role.id},'proposed',0)
    ON CONFLICT(event_id,user_id,role_id) DO UPDATE SET status='proposed',is_leader=0`);
  assert.equal(query(`SELECT status FROM team_assignments WHERE event_id=${event.id} AND user_id=${user.id} AND role_id=${role.id}`)[0].status,"proposed");
  query(`UPDATE team_assignments SET status='reserved' WHERE event_id=${event.id} AND user_id=${user.id} AND role_id=${role.id}`);
  assert.equal(query(`SELECT status FROM team_assignments WHERE event_id=${event.id} AND user_id=${user.id} AND role_id=${role.id}`)[0].status,"reserved");
  query(`UPDATE team_assignments SET status='confirmed' WHERE event_id=${event.id} AND user_id=${user.id} AND role_id=${role.id}`);
  assert.equal(query(`SELECT status FROM team_assignments WHERE event_id=${event.id} AND user_id=${user.id} AND role_id=${role.id}`)[0].status,"confirmed");
  query(`UPDATE team_assignments SET status='declined' WHERE event_id=${event.id} AND user_id=${user.id} AND role_id=${role.id}`);
  assert.equal(query(`SELECT status FROM team_assignments WHERE event_id=${event.id} AND user_id=${user.id} AND role_id=${role.id}`)[0].status,"declined");
  query(`DELETE FROM team_assignments WHERE event_id=${event.id} AND user_id=${user.id} AND role_id=${role.id}`);
  console.log("D1 local: session, availability, audit and assignment lifecycle persistence verified.");
} finally {
  query(`DELETE FROM sessions WHERE id='${token}'`);
  query(`DELETE FROM team_assignments WHERE user_id=${user.id} AND event_id IN (SELECT id FROM events WHERE event_date='2027-01-10')`);
  query(`DELETE FROM audit_log WHERE actor_user_id=${user.id} AND action='D1_INTEGRATION_TEST'`);
}
