import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

if (process.env.RUN_D1_INTEGRATION !== "1") process.exit(0);
const base = "http://127.0.0.1:8787";
const sql = statement => {
  const raw = execFileSync("npx", ["wrangler","d1","execute","louvor-db","--local","--json","--command",statement], {encoding:"utf8",timeout:45000});
  const data = JSON.parse(raw.slice(raw.indexOf("[")));
  assert.equal(data[0].success,true);
  return data[0].results ?? [];
};
const member = sql("SELECT id FROM users WHERE email='integrante.test@exemplo.invalid'")[0];
const event = sql("SELECT id FROM events WHERE event_date='2027-01-10'")[0];
const role = sql("SELECT id FROM ministry_roles WHERE active=1 ORDER BY id LIMIT 1")[0];
assert.ok(member?.id && event?.id && role?.id);
const token = "api-d1-integration-session";
const where = `event_id=${event.id} AND user_id=${member.id} AND role_id=${role.id}`;
async function confirm(value) {
  return fetch(base+"/api/team-confirmation", {
    method:"POST",
    headers:{Origin:base,Cookie:`louvor_session=${token}`,"Content-Type":"application/json"},
    body:JSON.stringify({eventId:event.id,roleId:role.id,confirm:value,userId:99999})
  });
}
try {
  sql(`INSERT OR REPLACE INTO sessions(id,user_id,expires_at) VALUES('${token}',${member.id},'2099-01-01T00:00:00.000Z')`);
  sql(`INSERT INTO team_assignments(event_id,user_id,role_id,status,is_leader) VALUES(${event.id},${member.id},${role.id},'proposed',0) ON CONFLICT(event_id,user_id,role_id) DO UPDATE SET status='proposed',is_leader=0`);
  assert.equal((await confirm(true)).status,409,"proposed assignment cannot be confirmed");
  assert.equal(sql(`SELECT status FROM team_assignments WHERE ${where}`)[0].status,"proposed");
  sql(`UPDATE team_assignments SET status='reserved' WHERE ${where}`);
  assert.equal((await confirm(false)).status,200,"member can decline reserved assignment");
  assert.equal(sql(`SELECT status FROM team_assignments WHERE ${where}`)[0].status,"declined");
  assert.equal((await confirm(true)).status,409,"declined assignment cannot be confirmed");
  assert.equal(sql(`SELECT status FROM team_assignments WHERE ${where}`)[0].status,"declined");
  // Confirm a reserved assignment only after eligibility and availability are present.
  sql(`INSERT OR IGNORE INTO member_roles(user_id,role_id) VALUES(${member.id},${role.id})`);
  sql(`INSERT INTO availability(event_id,user_id,available) VALUES(${event.id},${member.id},1)
    ON CONFLICT(event_id,user_id) DO UPDATE SET available=1`);
  sql(`UPDATE team_assignments SET status='reserved' WHERE ${where}`);
  assert.equal((await confirm(true)).status,200,"eligible member can confirm reserved assignment");
  assert.equal(sql(`SELECT status FROM team_assignments WHERE ${where}`)[0].status,"confirmed");
  assert.ok(sql(`SELECT COUNT(*) AS n FROM audit_log WHERE actor_user_id=${member.id} AND action='TEAM_CONFIRMATION' AND details LIKE '%"eventId":${event.id}%' AND details LIKE '%"roleId":${role.id}%'`)[0].n>=1);
  console.log("Real local D1 + Worker API: proposed/declined transitions, authorization and audit verified.");
} finally {
  sql(`DELETE FROM team_assignments WHERE ${where}`);
  sql(`DELETE FROM sessions WHERE id='${token}'`);
}
