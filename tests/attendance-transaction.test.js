import test from 'node:test';
import assert from 'node:assert/strict';
import { saveAttendance, closeAttendance } from '../src/db/attendance.js';

function fakeDatabase({ closed = false, missing = 0, active = 1 } = {}) {
  const batches = [];
  const DB = {
    prepare(sql) {
      return {
        sql,
        bind(...values) {
          this.values = values;
          return this;
        },
        async first() {
          if (sql.includes('FROM events')) return { id: 10 };
          if (sql.includes('FROM team_assignments') && sql.includes('LIMIT 1')) return { ok: 1 };
          if (sql.includes('FROM event_attendance WHERE')) return null;
          if (sql.includes('FROM event_attendance_closures')) return closed ? { status: 'closed' } : null;
          if (sql.includes('COUNT(DISTINCT user_id)')) return { total: active };
          if (sql.includes('COUNT(DISTINCT')) return { total: missing };
          throw new Error('Consulta inesperada: ' + sql);
        }
      };
    },
    async batch(statements) {
      batches.push(statements);
      return statements.map(() => ({ success: true }));
    }
  };
  return { env: { DB }, batches };
}

test('registro, histórico e auditoria são gravados no mesmo lote', async () => {
  const { env, batches } = fakeDatabase();
  const result = await saveAttendance(env,{ id: 1, role: 'admin' },{
    eventId:10,userId:2,status:'present',reason:'Conferência após o culto'
  });
  assert.equal(result.ok,true);
  assert.equal(batches.length,1);
  assert.equal(batches[0].length,3);
  assert.match(batches[0][1].sql,/event_attendance_history/);
  assert.match(batches[0][2].sql,/audit_log/);
});

test('correção após fechamento mantém auditoria transacional', async () => {
  const { env, batches } = fakeDatabase({closed:true});
  const result = await saveAttendance(env,{ id: 1, role: 'admin' },{
    eventId:10,userId:2,status:'present',reason:'Revisão'
  });
  assert.equal(result.correction,true);
  assert.equal(batches[0][2].values[1],'ATTENDANCE_CORRECTED');
});

test('fechamento bloqueado enquanto houver registro pendente', async () => {
  const { env, batches } = fakeDatabase({missing:1});
  await assert.rejects(closeAttendance(env,{id:1,role:'admin'},10),e=>e.status===409);
  assert.equal(batches.length,0);
});

test('fechamento e auditoria são gravados juntos', async () => {
  const { env, batches } = fakeDatabase();
  const result=await closeAttendance(env,{id:1,role:'admin'},10);
  assert.equal(result.ok,true);
  assert.equal(batches.length,1);
  assert.equal(batches[0].length,2);
  assert.match(batches[0][1].sql,/audit_log/);
});

test('não encerra evento sem integrantes escalados',async()=>{
 const {env,batches}=fakeDatabase({active:0});
 await assert.rejects(closeAttendance(env,{id:1,role:'admin'},10),e=>e.status===409);
 assert.equal(batches.length,0);
});
