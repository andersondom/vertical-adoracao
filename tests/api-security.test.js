import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

const env = { DB: { prepare() { throw new Error("DB nao deveria ser consultado"); } } };
const request = (path, method = "GET") =>
  new Request("https://example.test" + path, { method });

test("rota administrativa sem sessao retorna 401", async () => {
  const response = await worker.fetch(request("/api/admin/users", "POST"), env);
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error, "Não autenticado.");
});

test("consulta de dados sem sessao retorna 401", async () => {
  const response = await worker.fetch(request("/api/data"), env);
  assert.equal(response.status, 401);
});

test("rota desconhecida sem sessao nao revela informacoes", async () => {
  const response = await worker.fetch(request("/api/inexistente"), env);
  assert.equal(response.status, 401);
});

test("erros internos nao expõem detalhes", async () => {
  const response = await worker.fetch(request("/api/bootstrap-status"), env);
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "Erro interno do servidor." });
});
