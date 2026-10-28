import test from 'node:test';
import assert from 'node:assert/strict';
import { saveAttendance, closeAttendance } from '../src/db/attendance.js';

function db({ leaderEvents = [10], missing = 0 } = {}) {
  const batches = [];
  const env = { DB: {
    prepare(sql) {
      return {
        sql,
        bind(...values) { this.values = values; return this; },
        async first() {
          if (sql.includes('is_leader=1') && sql.includes('FROM team_assignments'))
            return leaderEvents.includes(this.values[0]) && this.values[1] === 4 ? { allowed: 1 } : null;
          if (sql.includes('FROM events')) return { id: this.values[0] };
          if (sql.includes('FROM team_assignments') && sql.includes('LIMIT 1')) return { ok: 1 };
          if (sql.includes('FROM event_attendance WHERE')) return null;
          if (sql.includes('FROM event_attendance_closures')) return null;
          if (sql.includes('COUNT(DISTINCT user_id)')) return { total: 1 };
          if (sql.includes('COUNT(DISTINCT')) return { total: missing };
          throw new Error('Consulta inesperada: ' + sql);
        }
      };
    },
    async batch(statements) { batches.push(statements); return statements.map(() => ({ success: true })); }
  }};
  return { env, batches };
}
const leader = { id: 4, role: 'member', active: 1 };

test('líder escalado registra presença no próprio evento com histórico e auditoria', async () => {
  const { env, batches } = db();
  const result = await saveAttendance(env, leader, {eventId:10,userId:9,status:'present',reason:'Conferência'});
  assert.equal(result.ok,true);
  assert.equal(batches.length,1);
  assert.equal(batches[0].length,3);
  assert.equal(batches[0][1].values[7],4);
  assert.equal(batches[0][2].values[0],4);
});

test('líder escalado pode encerrar presenças completas do próprio evento', async () => {
  const { env, batches } = db();
  assert.equal((await closeAttendance(env,leader,10)).ok,true);
  assert.equal(batches[0][0].values[1],4);
});

test('líder não acessa presenças de evento alheio nem produz escrita', async () => {
  const { env, batches } = db();
  await assert.rejects(saveAttendance(env,leader,{eventId:11,userId:9,status:'present',reason:'Teste'}),e=>e.status===403);
  await assert.rejects(closeAttendance(env,leader,11),e=>e.status===403);
  assert.equal(batches.length,0);
});

test('liderança removida impede novas alterações', async () => {
  const { env, batches } = db({leaderEvents:[]});
  await assert.rejects(saveAttendance(env,leader,{eventId:10,userId:9,status:'present',reason:'Teste'}),e=>e.status===403);
  assert.equal(batches.length,0);
});
