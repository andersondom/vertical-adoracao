import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';

test('admin cannot deactivate own account', async () => {
  let otherQueries = 0;
  const DB = { prepare(sql) {
    if (!sql.includes('FROM sessions s')) { otherQueries++; throw Error('Unexpected query'); }
    return { bind() { return { async first() { return { id: 1, name: 'Admin', email: 'admin@example.invalid', role: 'admin', active: 1, expires_at: '2099-01-01T00:00:00Z' }; } }; } };
  } };
  const response = await worker.fetch(new Request('https://vertical.example/api/admin/user-state', { method: 'POST', headers: { Origin: 'https://vertical.example', Cookie: 'louvor_session=test', 'Content-Type': 'application/json' }, body: JSON.stringify({userId:1,active:false}) }), {DB});
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, 'Você não pode desativar sua própria conta.');
  assert.equal(otherQueries, 0);
});
