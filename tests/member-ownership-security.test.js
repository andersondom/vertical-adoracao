import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

function fakeDb({ availabilityOpen = 1, assignment = null, eligibility = null, reservedAssignments = 0, conflictingLeader = false } = {}) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      return {
        bind(...args) {
          calls.push({ sql, args });
          return {
            async first() {
              if (sql.includes("FROM sessions s")) return {
                session_id: "fictional-session", expires_at: "2099-01-01T00:00:00.000Z",
                id: 7, name: "Member", email: "member@example.invalid", role: "member", active: 1
              };
              if (sql.includes("FROM schedule_settings")) return { availability_open: availabilityOpen };
              if (sql.includes("FROM team_assignments") && sql.includes("status,is_leader")) return assignment;
              if (sql.includes("AS member_active") && sql.includes("AS role_active")) return eligibility;
              if (sql.includes("SELECT id FROM events")) return { id: args[0] };
              if (sql.includes("SELECT id,active FROM users")) return { id: args[0], active: 1 };
              if (sql.includes("SELECT COUNT(*) AS total FROM team_assignments")) return { total: reservedAssignments };
              if (sql.includes("SELECT 1 AS ok FROM team_assignments")) return conflictingLeader ? { ok: 1 } : null;
              throw new Error("Unexpected query: " + sql);
            },
            async run() {
              if (/INSERT INTO availability|DELETE FROM availability|INSERT INTO audit_log|UPDATE team_assignments/.test(sql)) return { success: true };
              throw new Error("Unexpected mutation: " + sql);
            }
          };
        },
        async first() {
          if (sql.includes("FROM schedule_settings")) return { availability_open: availabilityOpen };
          throw new Error("Unexpected unbound query: " + sql);
        }
      };
    }
  };
}

async function post(path, body, DB) {
  return worker.fetch(new Request("https://vertical.example" + path, {
    method: "POST",
    headers: {
      Origin: "https://vertical.example",
      Cookie: "louvor_session=fictional-session",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  }), { DB });
}

test("member cannot change another user's availability when window is closed", async () => {
  const DB = fakeDb({ availabilityOpen: 0 });
  const response = await post("/api/availability", { eventId: 3, userId: 99, available: true }, DB);
  assert.equal(response.status, 403);
  assert.equal(DB.calls.filter(c => /availability\(|UPDATE availability|DELETE FROM availability/.test(c.sql)).length, 0);
});

test("member-supplied userId is ignored and availability targets authenticated member", async () => {
  const DB = fakeDb();
  // A successful update must target the authenticated identity, never the supplied userId.
  const response = await post("/api/availability", {
    eventId: 3, userId: 99, available: true
  }, DB);
  assert.equal(response.status, 200);
  const mutation = DB.calls.find(c => c.sql.includes("INSERT INTO availability"));
  assert.deepEqual(mutation.args.slice(0, 2), [3, 7]);
  const lookup = DB.calls.find(c => c.sql.includes("SELECT id,active FROM users"));
  assert.deepEqual(lookup.args, [7]);
});

for (const confirm of [true, false]) {
  test(`member cannot ${confirm ? "confirm" : "decline"} another user's team assignment`, async () => {
    const DB = fakeDb();
    const response = await post("/api/team-confirmation", {
      eventId: 3, roleId: 2, userId: 99, confirm
    }, DB);
    assert.equal(response.status, 404);
    const lookup = DB.calls.find(c => c.sql.includes("status,is_leader"));
    assert.deepEqual(lookup.args, [3, 7, 2]);
    assert.equal(DB.calls.some(c => /UPDATE team_assignments/.test(c.sql)), false);
  });
}


test("member declines own reserved assignment and audit records the transition", async () => {
  const DB = fakeDb({ assignment: { status: "reserved", is_leader: 0 } });
  const response = await post("/api/team-confirmation", {
    eventId: 3, roleId: 2, userId: 99, confirm: false
  }, DB);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  const update = DB.calls.find(c => c.sql.includes("UPDATE team_assignments"));
  assert.deepEqual(update.args, ["declined", 3, 7, 2]);
  assert.ok(DB.calls.some(c => c.sql.includes("INSERT INTO audit_log")));
});

test("member cannot change assignment after declining it", async () => {
  const DB = fakeDb({ assignment: { status: "declined", is_leader: 0 } });
  const response = await post("/api/team-confirmation", {
    eventId: 3, roleId: 2, confirm: false
  }, DB);
  assert.equal(response.status, 409);
  assert.equal(DB.calls.some(c => c.sql.includes("UPDATE team_assignments")), false);
});

test("member cannot confirm a proposed assignment before admin approval", async () => {
  const DB = fakeDb({ assignment: { status: "proposed", is_leader: 0 } });
  const response = await post("/api/team-confirmation", {
    eventId: 3, roleId: 2, confirm: true
  }, DB);
  assert.equal(response.status, 409);
  assert.equal(DB.calls.some(c => c.sql.includes("UPDATE team_assignments")), false);
});

test("eligible member confirms own reserved assignment and records audit", async () => {
  const DB = fakeDb({
    assignment: { status: "reserved", is_leader: 0 },
    eligibility: { member_active: 1, role_active: 1, eligible: 1, available: 1 }
  });
  const response = await post("/api/team-confirmation", {
    eventId: 3, roleId: 2, userId: 99, confirm: true
  }, DB);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  const eligibilityLookup = DB.calls.find(c => c.sql.includes("AS member_active"));
  assert.deepEqual(eligibilityLookup.args, [2, 3, 7]);
  const update = DB.calls.find(c => c.sql.includes("UPDATE team_assignments"));
  assert.deepEqual(update.args, ["confirmed", 3, 7, 2]);
  assert.ok(DB.calls.some(c => c.sql.includes("INSERT INTO audit_log")));
});

test("member cannot confirm when availability is no longer valid", async () => {
  const DB = fakeDb({
    assignment: { status: "reserved", is_leader: 0 },
    eligibility: { member_active: 1, role_active: 1, eligible: 1, available: 0 }
  });
  const response = await post("/api/team-confirmation", {
    eventId: 3, roleId: 2, confirm: true
  }, DB);
  assert.equal(response.status, 409);
  assert.equal(DB.calls.some(c => c.sql.includes("UPDATE team_assignments")), false);
});


for (const available of ["false", "true", 0, 1, null]) {
  test(`availability rejects non-boolean value ${JSON.stringify(available)} without mutation`, async () => {
    const DB = fakeDb();
    const response = await post("/api/availability", { eventId: 3, available }, DB);
    assert.equal(response.status, 400);
    assert.equal(DB.calls.some(c => /INSERT INTO availability|DELETE FROM availability|INSERT INTO audit_log/.test(c.sql)), false);
  });
}

test("availability rejects missing boolean without mutation", async () => {
  const DB = fakeDb();
  const response = await post("/api/availability", { eventId: 3 }, DB);
  assert.equal(response.status, 400);
  assert.equal(DB.calls.some(c => /INSERT INTO availability|DELETE FROM availability|INSERT INTO audit_log/.test(c.sql)), false);
});

test("availability accepts explicit true and updates the authenticated member", async () => {
  const DB = fakeDb();
  const response = await post("/api/availability", { eventId: 3, available: true }, DB);
  assert.equal(response.status, 200);
  const mutation = DB.calls.find(c => c.sql.includes("INSERT INTO availability"));
  assert.deepEqual(mutation.args.slice(0,2), [3,7]);
});


test("availability accepts explicit false and withdraws only authenticated member", async () => {
  const DB = fakeDb();
  const response = await post("/api/availability", { eventId: 3, userId: 99, available: false }, DB);
  assert.equal(response.status, 200);
  const check = DB.calls.find(c => c.sql.includes("SELECT COUNT(*) AS total FROM team_assignments"));
  assert.deepEqual(check.args, [3, 7]);
  const mutation = DB.calls.find(c => c.sql.includes("DELETE FROM availability"));
  assert.deepEqual(mutation.args, [3, 7]);
  assert.ok(DB.calls.some(c => c.sql.includes("INSERT INTO audit_log")));
});


test("availability withdrawal is blocked for reserved or confirmed assignments", async () => {
  const DB = fakeDb({ reservedAssignments: 1 });
  const response = await post("/api/availability", { eventId: 3, available: false }, DB);
  assert.equal(response.status, 409);
  const check = DB.calls.find(c => c.sql.includes("SELECT COUNT(*) AS total FROM team_assignments"));
  assert.deepEqual(check.args, [3, 7]);
  assert.equal(DB.calls.some(c => /DELETE FROM availability|INSERT INTO audit_log/.test(c.sql)), false);
});


test("member cannot withdraw availability while submission window is closed", async () => {
  const DB = fakeDb({ availabilityOpen: 0 });
  const response = await post("/api/availability", { eventId: 3, available: false }, DB);
  assert.equal(response.status, 403);
  assert.equal(DB.calls.some(c => /DELETE FROM availability|INSERT INTO availability|INSERT INTO audit_log/.test(c.sql)), false);
});


test("member cannot confirm leadership already reserved for another assignment", async () => {
  const DB = fakeDb({
    assignment: { status: "reserved", is_leader: 1 },
    eligibility: { member_active: 1, role_active: 1, eligible: 1, available: 1 },
    conflictingLeader: true
  });
  const response = await post("/api/team-confirmation", { eventId: 3, roleId: 2, confirm: true }, DB);
  assert.equal(response.status, 409);
  const check = DB.calls.find(c => c.sql.includes("SELECT 1 AS ok FROM team_assignments"));
  assert.deepEqual(check.args, [3, 7, 2]);
  assert.equal(DB.calls.some(c => /UPDATE team_assignments|INSERT INTO audit_log/.test(c.sql)), false);
});
