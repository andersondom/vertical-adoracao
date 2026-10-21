import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

test("bootstrap concorrente nao cria segundo administrador", async () => {
  let insertSql = "";
  const db = {
    prepare(sql) {
      if (sql.includes("SELECT COUNT(*) AS total FROM users")) {
        return { first: async () => ({ total: 0 }) };
      }
      if (sql.includes("INSERT INTO users")) {
        insertSql = sql;
        return { bind: (...args) => {
          assert.equal(args.length, 4);
          return { run: async () => ({ meta: { changes: 0, last_row_id: 0 } }) };
        }};
      }
      throw new Error("Consulta inesperada: " + sql);
    }
  };
  const request = new Request("https://vertical.example/api/bootstrap", {
    method: "POST",
    headers: { Origin: "https://vertical.example", "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Teste", email: "admin@exemplo.invalid", password: "senha-teste-123" })
  });
  const response = await worker.fetch(request, { DB: db });
  assert.equal(response.status, 409);
  assert.match(insertSql, /WHERE NOT EXISTS \(SELECT 1 FROM users\)/);
});

test("sessao com data invalida nao e autenticada", async () => {
  const { getAuth } = await import("../src/auth/session.js");
  const calls = [];
  const db = {
    prepare(sql) {
      calls.push(sql);
      return {
        bind() {
          return {
            first: async () => ({ id: 1, active: 1, expires_at: "data-invalida" }),
            run: async () => ({ success: true })
          };
        }
      };
    }
  };
  const request = new Request("https://vertical.example/api/me", {
    headers: { Cookie: "louvor_session=teste" }
  });
  assert.equal(await getAuth(request, { DB: db }), null);
  assert.ok(calls.some(sql => sql.includes("DELETE FROM sessions")));
});
