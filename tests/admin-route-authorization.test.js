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
