import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

function fixture(status = "reserved", attendanceClosed = false) {
  const assignment = { status };
  const audit = [];
  const db = {
    prepare(sql) {
      if (sql.includes("FROM sessions s")) return {
        bind(token) {
          assert.equal(token, "sessao-teste");
          return { async first() {
            return { session_id: token, expires_at: "2099-01-01T00:00:00.000Z",
              id: 1, name: "Admin", email: "admin@exemplo.invalid", role: "admin", active: 1 };
          } };
        }
      };
      if (sql.includes("FROM event_attendance_closures")) return {
        bind(eventId) {
          assert.equal(eventId,4);
          return { async first() { return attendanceClosed ? {status:"closed"} : null; } };
        }
      };
      if (sql.includes("SELECT status FROM team_assignments")) return {
        bind(eventId,userId,roleId) {
          assert.deepEqual([eventId,userId,roleId],[4,8,2]);
          return { async first() { return assignment.status ? {status:assignment.status} : null; } };
        }
      };
      if (sql.includes("UPDATE team_assignments SET status='declined'")) return {
        bind(eventId,userId,roleId) {
          assert.deepEqual([eventId,userId,roleId],[4,8,2]);
          return { async run() { assignment.status="declined"; return {success:true}; } };
        }
      };
      if (sql.includes("INSERT INTO audit_log")) return {
        bind(actor,action,details) {
          return { async run() { audit.push({actor,action,details:JSON.parse(details)}); return {success:true}; } };
        }
      };
      throw new Error("Consulta inesperada: "+sql);
    }
  };
  return {db,assignment,audit};
}

async function cancel(fixture,body) {
  return worker.fetch(new Request("https://vertical.example/api/admin/team-cancel",{
    method:"POST",
    headers:{Cookie:"louvor_session=sessao-teste",Origin:"https://vertical.example"},
    body:JSON.stringify(body)
  }),{DB:fixture.db});
}

test("administrador libera vaga e registra auditoria",async()=>{
  const f=fixture("confirmed");
  const response=await cancel(f,{eventId:4,userId:8,roleId:2});
  assert.equal(response.status,200);
  assert.equal(f.assignment.status,"declined");
  assert.equal(f.audit.length,1);
  assert.equal(f.audit[0].action,"TEAM_ASSIGNMENT_CANCEL");
  assert.equal(f.audit[0].details.previousStatus,"confirmed");
});

test("cancelamento repetido não produz nova auditoria",async()=>{
  const f=fixture("declined");
  const response=await cancel(f,{eventId:4,userId:8,roleId:2});
  assert.equal(response.status,409);
  assert.equal(f.audit.length,0);
});

test("cancelamento de escala inexistente retorna 404",async()=>{
  const f=fixture(null);
  const response=await cancel(f,{eventId:4,userId:8,roleId:2});
  assert.equal(response.status,404);
  assert.equal(f.audit.length,0);
});

test("cancelamento rejeita identificadores inválidos",async()=>{
  const f=fixture();
  const response=await cancel(f,{eventId:4,userId:-8,roleId:2});
  assert.equal(response.status,400);
  assert.equal(f.audit.length,0);
});

test("cancelamento após fechamento de presenças é bloqueado",async()=>{
  const f=fixture("confirmed",true);
  const response=await cancel(f,{eventId:4,userId:8,roleId:2});
  assert.equal(response.status,409);
  assert.equal(f.assignment.status,"confirmed");
  assert.equal(f.audit.length,0);
});
