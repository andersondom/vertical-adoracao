import test from 'node:test';
import assert from 'node:assert/strict';
import { canManageEventAttendance, requireEventAttendanceManager } from '../src/auth/event-attendance-policy.js';

function fixture(allowed) {
  let queries = 0;
  const env = { DB: { prepare(sql) {
    assert.match(sql, /is_leader=1/);
    assert.match(sql, /event_id=\?/);
    return { bind(eventId,userId) {
      return { async first() {
        queries++;
        assert.ok(eventId > 0 && userId > 0);
        return allowed ? { allowed: 1 } : null;
      }};
    }};
  }}};
  return {env, get queries(){return queries;}};
}

test('administrador mantém acesso sem consulta de delegação', async () => {
  const f=fixture(false);
  assert.equal(await canManageEventAttendance(f.env,{id:1,role:'admin'},15),true);
  assert.equal(f.queries,0);
});

test('líder ativo na escala do evento pode receber autorização', async () => {
  const f=fixture(true);
  assert.equal(await canManageEventAttendance(f.env,{id:3,role:'member'},15),true);
  assert.equal(f.queries,1);
});

test('integrante sem liderança ativa não recebe autorização', async () => {
  const f=fixture(false);
  await assert.rejects(
    requireEventAttendanceManager(f.env,{id:3,role:'member'},15),
    e=>e.status===403
  );
});

test('identificadores inválidos e conta inativa são rejeitados sem consultar banco', async () => {
  const f=fixture(true);
  assert.equal(await canManageEventAttendance(f.env,{id:0,role:'member'},15),false);
  assert.equal(await canManageEventAttendance(f.env,{id:3,role:'member'},0),false);
  assert.equal(await canManageEventAttendance(f.env,{id:3,role:'member',active:0},15),false);
  assert.equal(f.queries,0);
});
