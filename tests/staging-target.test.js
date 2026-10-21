import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function validate(config) {
  const dir = mkdtempSync(join(tmpdir(), "vertical-staging-"));
  try {
    const path = join(dir, "wrangler.staging.json");
    writeFileSync(path, JSON.stringify(config));
    return execFileSync(process.execPath, ["scripts/verify-staging-target.mjs", path], {
      encoding: "utf8", stdio: ["ignore", "pipe", "pipe"]
    });
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

const valid = {
  name: "ministerio-louvor-staging",
  d1_databases: [{
    binding: "DB", database_name: "louvor-staging",
    database_id: "11111111-2222-4333-8444-555555555555",
    migrations_dir: "migrations"
  }]
};

test("aceita configuracao staging exclusiva", () => {
  assert.match(validate(valid), /OK: staging/);
});
test("rejeita placeholder em vez de ID D1 real", () => {
  assert.throws(() => validate({
    ...valid, d1_databases: [{ ...valid.d1_databases[0], database_id: "SUBSTITUIR_PELO_ID_DO_BANCO_STAGING" }]
  }));
});
test("rejeita ID do D1 de producao", () => {
  assert.throws(() => validate({
    ...valid, d1_databases: [{ ...valid.d1_databases[0], database_id: "b3205ce2-14d6-4b9f-b93f-02457fb34c62" }]
  }));
});
test("rejeita nome do Worker de producao", () => {
  assert.throws(() => validate({ ...valid, name: "ministerio-louvor" }));
});
