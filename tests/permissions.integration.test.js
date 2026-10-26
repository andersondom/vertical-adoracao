import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

function dbForRole(role) {
  return {
    prepare(sql) {
      if (!sql.includes("FROM sessions s")) throw new Error("Consulta inesperada: " + sql);
      return {
        bind(token) {
          assert.equal(token, "sessao-teste");
          return {
            async first() {
              return {
                session_id: token,
                expires_at: "2099-01-01T00:00:00.000Z",
                id: role === "admin" ? 1 : 2,
                name: "Teste",
                email: "teste@exemplo.invalid",
                role,
                active: 1
              };
            }
          };
        }
      };
    }
  };
}

async function call(path, role, method = "POST") {
  const headers = {
    Cookie: "louvor_session=sessao-teste",
    Origin: "https://vertical.example"
  };
  const request = new Request("https://vertical.example" + path, {
    method,
    headers,
    ...(method === "POST" ? { body: JSON.stringify({}) } : {})
  });
  return worker.fetch(request, { DB: dbForRole(role) });
}

for (const path of [
  "/api/admin/users",
  "/api/admin/assign",
  "/api/admin/user-state",
  "/api/admin/password",
  "/api/admin/settings",
  "/api/admin/event",
  "/api/admin/member-role",
  "/api/admin/event-requirement",
  "/api/admin/team-assignment",
  "/api/admin/team-cancel"
]) {
  test("integrante nao acessa " + path, async () => {
    const response = await call(path, "member");
    assert.equal(response.status, 403);
    assert.equal((await response.json()).error, "Acesso negado.");
  });
}

test("administrador passa da verificacao de permissao", async () => {
  // Dados invalidos sao rejeitados antes de qualquer escrita.
  const response = await call("/api/admin/event", "admin");
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /data válida/);
});

test("CSRF bloqueia requisicao autenticada antes de consultar o banco", async () => {
  const request = new Request("https://vertical.example/api/admin/event", {
    method: "POST",
    headers: {
      Cookie: "louvor_session=sessao-teste",
      Origin: "https://outro.example"
    }
  });
  const response = await worker.fetch(request, {
    DB: { prepare() { throw new Error("DB nao deveria ser consultado"); } }
  });
  assert.equal(response.status, 403);
});

test("integrante nao acessa sugestoes administrativas", async () => {
  const response = await call("/api/admin/team-suggestions?eventId=1", "member", "GET");
  assert.equal(response.status, 403);
});

test("rotas novas validam dados antes de consultar entidades", async () => {
  for (const path of [
    "/api/admin/member-role",
    "/api/admin/event-requirement",
    "/api/admin/team-assignment",
    "/api/admin/team-cancel",
    "/api/team-confirmation"
  ]) {
    const response = await call(path, "admin");
    assert.equal(response.status, 400, path);
  }
});

test("integrante nao pode confirmar escala de outro usuario por ID enviado", async () => {
  const response = await call("/api/team-confirmation", "member");
  assert.equal(response.status, 400);
});
