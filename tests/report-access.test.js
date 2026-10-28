import test from 'node:test';
import assert from 'node:assert/strict';
import { getParticipationReport } from '../src/db/reports.js';

const db = {
  prepare() {
    return {
      bind(...params) {
        assert.equal(params[0], 7);
        return { async all() { return { results: [] }; } };
      }
    };
  }
};
const env = { DB: db };
test('integrante comum só consulta seus próprios indicadores', async () => {
  await assert.rejects(
    getParticipationReport(env,{id:7,role:'member'},{start:'2026-10-01',end:'2026-10-31',memberId:8}),
    error => error.status === 403
  );
  const own = await getParticipationReport(env,{id:7,role:'member'},{start:'2026-10-01',end:'2026-10-31'});
  assert.equal(own.memberId,7);
  assert.equal(own.indicators.attendanceRate,null);
});
