import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const stagingId = process.env.CLOUDFLARE_STAGING_D1_ID || 'a5a48f44-69dd-4040-ba03-25b36197a07b';
const production = JSON.parse(readFileSync('wrangler.jsonc', 'utf8'));
const staging = JSON.parse(readFileSync('wrangler.staging.example.jsonc', 'utf8'));
const productionDb = production.d1_databases.find(db => db.binding === 'DB');
const stagingDb = staging.d1_databases.find(db => db.binding === 'DB');

assert.match(stagingId, /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i);
assert.notEqual(stagingId, productionDb.database_id, 'Banco de homologacao nao pode ser o de producao');
assert.notEqual(staging.name, production.name, 'Worker de homologacao nao pode ser o de producao');
assert.notEqual(stagingDb.database_name, productionDb.database_name);
stagingDb.database_id = stagingId;
writeFileSync('wrangler.staging.jsonc', JSON.stringify(staging, null, 2) + '\n');
console.log('Configuracao local de homologacao criada: ' + staging.name + ' / ' + stagingDb.database_name);
