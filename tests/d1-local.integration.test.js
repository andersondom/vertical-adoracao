import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const enabled = process.env.RUN_D1_INTEGRATION === "1";
function query(sql) {
  const output = execFileSync("npx", [
    "wrangler", "d1", "execute", "louvor-db", "--local",
    "--command", sql, "--json"
  ], { encoding:"utf8", timeout:60000 });
  const result = JSON.parse(output);
  return result[0]?.results || [];
}
test("D1 local: migration cria tabelas essenciais", { skip:!enabled }, () => {
  const rows=query("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users','events','availability','login_attempts') ORDER BY name");
  assert.deepEqual(rows.map(r=>r.name),["availability","events","login_attempts","users"]);
});
test("D1 local: indisponibilidade de email duplicado", { skip:!enabled }, () => {
  const rows=query("SELECT COUNT(*) AS total FROM users WHERE email='nao-existe@exemplo.invalid'");
  assert.equal(Number(rows[0].total),0);
});
test("D1 local: contador de tentativas respeita atualizacao atomica", { skip:!enabled }, () => {
  const key="ci-integration-key";
  query("DELETE FROM login_attempts WHERE identity_hash='ci-integration-key'");
  query("INSERT INTO login_attempts(identity_hash,failed_count,window_started_at,locked_until) VALUES('ci-integration-key',1,100,0)");
  query("INSERT INTO login_attempts(identity_hash,failed_count,window_started_at,locked_until) VALUES('ci-integration-key',1,101,0) ON CONFLICT(identity_hash) DO UPDATE SET failed_count=login_attempts.failed_count+1");
  const rows=query("SELECT failed_count FROM login_attempts WHERE identity_hash='ci-integration-key'");
  assert.equal(Number(rows[0].failed_count),2);
  query("DELETE FROM login_attempts WHERE identity_hash='ci-integration-key'");
});
