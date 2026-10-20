import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const ci = readFileSync(".github/workflows/ci.yml", "utf8");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const staging = JSON.parse(readFileSync("wrangler.staging.example.jsonc", "utf8"));
const production = JSON.parse(readFileSync("wrangler.jsonc", "utf8"));

assert.match(ci, /wrangler deploy --dry-run/);
assert.doesNotMatch(ci, /(?:^|\s)(?:npm run deploy|wrangler deploy --env|wrangler d1 .*--remote)(?:\s|$)/m);
assert.match(pkg.scripts["db:local"], /--local/);
assert.match(pkg.scripts["seed:local"], /--local/);
assert.notEqual(staging.name, production.name);
assert.notEqual(staging.d1_databases[0].database_id, production.d1_databases[0].database_id);
console.log("OK: pipeline restrito a validacao local e compilacao seca.");
