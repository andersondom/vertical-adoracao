import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

function readJsonc(path) {
  const text = readFileSync(path, "utf8");
  // Configuracoes do projeto nao possuem comentarios; JSON valido tambem e JSONC valido.
  return JSON.parse(text);
}

const production = readJsonc("wrangler.jsonc");
const staging = readJsonc("wrangler.staging.example.jsonc");
const prod = production.d1_databases?.find(x => x.binding === "DB");
const stage = staging.d1_databases?.find(x => x.binding === "DB");
assert.ok(prod?.database_id, "Banco de producao nao configurado");
assert.ok(stage?.database_id, "Banco de staging nao configurado");
assert.notEqual(production.name, staging.name, "Workers precisam de nomes distintos");
assert.notEqual(prod.database_name, stage.database_name, "Bancos precisam de nomes distintos");
assert.notEqual(prod.database_id, stage.database_id, "IDs D1 precisam ser diferentes");
assert.equal(stage.database_id, "SUBSTITUIR_PELO_ID_DO_BANCO_STAGING",
  "O modelo deve manter placeholder; nao registrar ID real de staging neste arquivo");
assert.equal(stage.migrations_dir, "migrations");
console.log("OK: modelo de staging separado de producao, sem provisionamento remoto.");
