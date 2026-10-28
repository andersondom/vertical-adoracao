import test from 'node:test';
import assert from 'node:assert/strict';
import { canManageEventAttendance, requireEventAttendanceManager } from '../src/auth/event-attendance-policy.js';
import { saveAttendance, closeAttendance } from '../src/db/attendance.js';

function fixture({ eventId = 20, userId = 7, leader = true, status = 'confirmed' } = {}) {
  const calls = [];
  const env = { DB: {
    prepare(sql) {
      return {
        bind(...args) {
          calls.push({sql, args});
          return {
            async first() {
              if (!sql.includes('is_leader=1')) throw new Error('Unexpected DB read: ' + sql);
              const permittedStatus = ['reserved', 'confirmed'].includes(status);
              return leader && permittedStatus && args[0] === eventId && args[1] === userId
                ? { allowed: 1 } : null;
            }
          };
        }
      };
    },
    async batch() { throw new Error('No write expected for unauthorized request'); }
  }};
  return { env, calls };
}
const member = {id:7, role:'member', active:1};

test('delegation query restricts leader, event, user and active commitment statuses', async () => {
  const f = fixture();
  assert.equal(await canManageEventAttendance(f.env,member,20),true);
  const q=f.calls[0];
  assert.match(q.sql,/event_id=\?/);
  assert.match(q.sql,/user_id=\?/);
  assert.match(q.sql,/is_leader=1/);
  assert.match(q.sql,/status IN \('confirmed','reserved'\)/);
  assert.deepEqual(q.args,[20,7]);
});

test('reserved leader is authorized but proposed leader is not', async () => {
  assert.equal(await canManageEventAttendance(fixture({status:'reserved'}).env,member,20),true);
  assert.equal(await canManageEventAttendance(fixture({status:'proposed'}).env,member,20),false);
});

test('revoked or declined leadership denies read, write and closure', async () => {
  for (const f of [fixture({leader:false}), fixture({status:'declined'})]) {
    await assert.rejects(requireEventAttendanceManager(f.env,member,20),e=>e.status===403);
    await assert.rejects(saveAttendance(f.env,member,{eventId:20,userId:8,status:'present',reason:'Test'}),e=>e.status===403);
    await assert.rejects(closeAttendance(f.env,member,20),e=>e.status===403);
    assert.ok(f.calls.every(c=>c.sql.includes('is_leader=1')));
  }
});

test('leader of another event cannot write or close this event', async () => {
  const f=fixture({eventId:21});
  await assert.rejects(saveAttendance(f.env,member,{eventId:20,userId:8,status:'present',reason:'Test'}),e=>e.status===403);
  await assert.rejects(closeAttendance(f.env,member,20),e=>e.status===403);
});

test('inactive account cannot manage attendance even with leader assignment', async () => {
  const f=fixture();
  assert.equal(await canManageEventAttendance(f.env,{...member,active:0},20),false);
  assert.equal(f.calls.length,0);
});

test('non-leader and missing actor denied without database access', async () => {
  const f=fixture();
  assert.equal(await canManageEventAttendance(f.env,null,20),false);
  assert.equal(await canManageEventAttendance(f.env,{id:0,role:'member',active:1},20),false);
  assert.equal(f.calls.length,0);
});
