import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const path = process.argv[2];
if (!path || path === "wrangler.jsonc" || path.endsWith("/wrangler.jsonc")) {
  throw new Error("Informe arquivo de staging separado. Nunca use wrangler.jsonc.");
}
const prod = JSON.parse(readFileSync("wrangler.jsonc", "utf8"));
const stage = JSON.parse(readFileSync(path, "utf8"));
const a = prod.d1_databases?.find(db => db.binding === "DB");
const b = stage.d1_databases?.find(db => db.binding === "DB");
assert.ok(a?.database_id && b?.database_id, "IDs D1 obrigatorios");
assert.match(b.database_id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  "ID D1 de staging deve ser UUID real");
assert.notEqual(a.database_id, b.database_id, "PROIBIDO reutilizar D1 de producao");
assert.notEqual(a.database_name, b.database_name, "Nome do D1 deve ser exclusivo");
assert.notEqual(prod.name, stage.name, "Nome do Worker deve ser exclusivo");
assert.equal(b.database_name, "louvor-staging", "Nome esperado do D1 de staging");
assert.equal(stage.name, "ministerio-louvor-staging", "Nome esperado do Worker staging");
assert.equal(b.migrations_dir, "migrations");
console.log("OK: staging usa Worker e banco D1 exclusivos.");
