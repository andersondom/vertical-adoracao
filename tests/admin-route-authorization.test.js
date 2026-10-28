import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

const adminRoutes = [
  ["/api/admin/assign", "POST"],
  ["/api/admin/team-assignment", "POST"],
  ["/api/admin/team-cancel", "POST"],
  ["/api/admin/team-suggestions", "GET"],
  ["/api/admin/member-role", "POST"],
  ["/api/admin/event-requirement", "POST"],
  ["/api/admin/users", "POST"],
  ["/api/admin/user-state", "POST"],
  ["/api/admin/password", "POST"],
  ["/api/admin/settings", "POST"],
  ["/api/admin/event", "POST"]
];

function fakeEnv(role) {
  const calls = [];
  const DB = { prepare(sql) {
    calls.push(sql);
    if (!/FROM sessions s/.test(sql)) throw new Error("Unexpected database access: " + sql);
    return { bind() { return { async first() {
      return { session_id: "test-session", expires_at: "2099-01-01T00:00:00.000Z",
        id: 1, name: "Fictitious", email: "test@example.invalid", role, active: 1 };
    } }; } };
  } };
  return { DB, calls };
}

for (const [path, method] of adminRoutes) {
  test(`member cannot access ${method} ${path}`, async () => {
    const { DB, calls } = fakeEnv("member");
    const request = new Request("https://vertical.example" + path, {
      method,
      headers: { Cookie: "louvor_session=test-session",
        ...(method === "POST" ? { Origin: "https://vertical.example",
          "Content-Type": "application/json" } : {}) },
      ...(method === "POST" ? { body: "{}" } : {})
    });
    const response = await worker.fetch(request, { DB });
    assert.equal(response.status, 403);
    assert.equal(calls.length, 1, "member must not reach administrative database queries");
  });

  test(`anonymous cannot access ${method} ${path}`, async () => {
    const request = new Request("https://vertical.example" + path, {
      method,
      headers: method === "POST" ? { Origin: "https://vertical.example",
        "Content-Type": "application/json" } : {},
      ...(method === "POST" ? { body: "{}" } : {})
    });
    const response = await worker.fetch(request, {
      DB: { prepare() { throw new Error("Anonymous request must not query administrative data"); } }
    });
    assert.equal(response.status, 401);
  });
}


function adminEnv() {
  const mutations = [];
  const DB = {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              if (sql.includes("FROM sessions s")) return {
                session_id: "admin-test-session", expires_at: "2099-01-01T00:00:00.000Z",
                id: 10, name: "Fictitious Admin", email: "admin@example.invalid",
                role: "admin", active: 1
              };
              throw new Error("Unexpected SELECT: " + sql);
            },
            async run() {
              mutations.push({ sql, args });
              if (/UPDATE schedule_settings|INSERT INTO events|INSERT INTO audit_log/.test(sql)) return { success: true };
              throw new Error("Unexpected mutation: " + sql);
            }
          };
        }
      };
    }
  };
  return { DB, mutations };
}

async function adminPost(path, body, DB) {
  return worker.fetch(new Request("https://vertical.example" + path, {
    method: "POST",
    headers: {
      Cookie: "louvor_session=admin-test-session",
      Origin: "https://vertical.example",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  }), { DB });
}

for (const availabilityOpen of [true, false]) {
  test(`admin can ${availabilityOpen ? "open" : "close"} availability window`, async () => {
    const { DB, mutations } = adminEnv();
    const response = await adminPost("/api/admin/settings", { availabilityOpen }, DB);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    const update = mutations.find(x => x.sql.includes("UPDATE schedule_settings"));
    assert.deepEqual(update.args, [availabilityOpen ? 1 : 0]);
    assert.ok(mutations.some(x => x.sql.includes("INSERT INTO audit_log")));
  });
}

test("admin can create a valid event", async () => {
  const { DB, mutations } = adminEnv();
  const response = await adminPost("/api/admin/event", {
    eventDate: "2027-01-10", dayCode: "D", title: "Evento fictício", icon: "🎶"
  }, DB);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  const insert = mutations.find(x => x.sql.includes("INSERT INTO events"));
  assert.deepEqual(insert.args, ["2027-01-10", "D", "Evento fictício", "🎶"]);
  assert.ok(mutations.some(x => x.sql.includes("INSERT INTO audit_log")));
});

test("admin invalid event is rejected without mutation", async () => {
  const { DB, mutations } = adminEnv();
  const response = await adminPost("/api/admin/event", { eventDate: "invalid", dayCode: "D" }, DB);
  assert.equal(response.status, 400);
  assert.equal(mutations.length, 0);
});
