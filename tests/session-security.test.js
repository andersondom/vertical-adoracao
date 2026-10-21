import test from "node:test";
import assert from "node:assert/strict";
import { getAuth, createSessionResponse, logout } from "../src/auth/session.js";

function fakeDb(row) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      return {
        bind(...params) {
          calls.push({ sql, params });
          return {
            async first() { return row; },
            async run() { return { success: true }; }
          };
        }
      };
    }
  };
}

function req(cookie = "") {
  return new Request("https://vertical.example/api/me", {
    headers: cookie ? { Cookie: cookie } : {}
  });
}

test("sessao ausente nao consulta banco", async () => {
  const db = fakeDb(null);
  assert.equal(await getAuth(req(), { DB: db }), null);
  assert.equal(db.calls.length, 0);
});

test("sessao expirada e rejeitada e revogada", async () => {
  const db = fakeDb({ id: 1, active: 1, expires_at: "2000-01-01T00:00:00Z" });
  assert.equal(await getAuth(req("louvor_session=expirada"), { DB: db }), null);
  assert.ok(db.calls.some(x => x.sql.includes("DELETE FROM sessions")));
});

test("conta desativada nao mantem sessao", async () => {
  const db = fakeDb({ id: 1, active: 0, expires_at: "2099-01-01T00:00:00Z" });
  assert.equal(await getAuth(req("louvor_session=desativada"), { DB: db }), null);
  assert.ok(db.calls.some(x => x.sql.includes("DELETE FROM sessions")));
});

test("sessao valida expõe somente campos publicos do usuario", async () => {
  const db = fakeDb({
    id: 7, name: "Teste", email: "teste@exemplo.invalid",
    role: "member", active: 1, expires_at: "2099-01-01T00:00:00Z",
    password_hash: "nao-expor"
  });
  assert.deepEqual(await getAuth(req("louvor_session=valida"), { DB: db }), {
    user: { id: 7, name: "Teste", email: "teste@exemplo.invalid", role: "member" }
  });
});

test("cookie de sessao usa flags de seguranca", async () => {
  const db = fakeDb(null);
  const response = await createSessionResponse({ DB: db }, 1, { ok: true });
  const cookie = response.headers.get("Set-Cookie");
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Path=\//);
  assert.match(cookie, /Max-Age=2592000/);
  assert.ok(db.calls.some(x => x.sql.includes("INSERT INTO sessions")));
});

test("logout revoga sessao e expira cookie", async () => {
  const db = fakeDb(null);
  const response = await logout(req("louvor_session=ativa"), { DB: db });
  assert.equal(response.status, 302);
  assert.match(response.headers.get("Set-Cookie"), /Max-Age=0/);
  assert.ok(db.calls.some(x => x.sql.includes("DELETE FROM sessions")));
});
