import test from 'node:test';
import assert from 'node:assert/strict';
import { saveAttendance, closeAttendance } from '../src/db/attendance.js';

function fixture({ previous = null, closed = false, leader = false } = {}) {
  const batches = [];
  const env = { DB: {
    prepare(sql) {
      return {
        sql,
        bind(...values) { this.values = values; return this; },
        async first() {
          if (sql.includes('FROM events')) return { id: 10 };
          if (sql.includes('is_leader=1') && sql.includes('FROM team_assignments')) return leader ? { allowed: 1 } : null;
          if (sql.includes('FROM team_assignments') && sql.includes('LIMIT 1')) return { ok: 1 };
          if (sql.includes('FROM event_attendance WHERE')) return previous;
          if (sql.includes('FROM event_attendance_closures')) return closed ? { status: 'closed' } : null;
          if (sql.includes('COUNT(DISTINCT user_id)')) return { total: 1 };
          if (sql.includes('COUNT(DISTINCT')) return { total: 0 };
          throw new Error('Consulta não prevista: ' + sql);
        }
      };
    },
    async batch(statements) { batches.push(statements); return statements.map(() => ({ success: true })); }
  }};
  return { env, batches };
}

const admin = { id: 7, role: 'admin' };
const member = { id: 8, role: 'member' };

test('correção de evento fechado preserva status, justificativa e motivo anterior no histórico', async () => {
  const { env, batches } = fixture({
    closed: true,
    previous: { status: 'absent_justified', justification: 'Compromisso familiar' }
  });
  const result = await saveAttendance(env, admin, {
    eventId: 10, userId: 9, status: 'present',
    justification: '', reason: 'Conferência documental'
  });
  assert.equal(result.correction, true);
  assert.equal(batches.length, 1);
  const [attendance, history, audit] = batches[0];
  assert.match(attendance.sql, /INSERT INTO event_attendance/);
  assert.equal(attendance.values[3], null);
  assert.match(history.sql, /INSERT INTO event_attendance_history/);
  assert.deepEqual(history.values, [
    10, 9, 'absent_justified', 'present', 'Compromisso familiar',
    null, 'Conferência documental', 7
  ]);
  assert.equal(audit.values[1], 'ATTENDANCE_CORRECTED');
});

test('tentativa de correção sem motivo não grava presença nem auditoria', async () => {
  const { env, batches } = fixture({ closed: true });
  await assert.rejects(
    saveAttendance(env, admin, { eventId: 10, userId: 9, status: 'present', reason: '   ' }),
    error => error.status === 400
  );
  assert.equal(batches.length, 0);
});

test('integrante sem liderança não pode registrar nem encerrar presenças', async () => {
  const { env, batches } = fixture();
  await assert.rejects(
    saveAttendance(env, member, { eventId: 10, userId: 9, status: 'present', reason: 'Teste' }),
    error => error.status === 403
  );
  await assert.rejects(closeAttendance(env, member, 10), error => error.status === 403);
  assert.equal(batches.length, 0);
});

test('ausência justificada exige justificativa e não deixa escrita parcial', async () => {
  const { env, batches } = fixture();
  await assert.rejects(
    saveAttendance(env, admin, {
      eventId: 10, userId: 9, status: 'absent_justified',
      justification: ' ', reason: 'Conferência'
    }),
    error => error.status === 400
  );
  assert.equal(batches.length, 0);
});
