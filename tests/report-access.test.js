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

test('integrante pode informar explicitamente seu próprio identificador',async()=>{
 const own=await getParticipationReport(env,{id:7,role:'member'},{start:'2026-10-01',end:'2026-10-31',memberId:7});
 assert.equal(own.memberId,7);
});

test('administrador pode consultar integrante específico sem mudar seu próprio perfil',async()=>{
 const queries=[];
 const adminEnv={DB:{prepare(sql){return {bind(...values){queries.push(values);return {async all(){return {results:[]}}}}}}}};
 const result=await getParticipationReport(adminEnv,{id:1,role:'admin'},{start:'2026-10-01',end:'2026-10-31',memberId:8});
 assert.equal(result.memberId,8);
 assert.deepEqual(queries[0],[8,'2026-10-01','2026-10-31']);
});

test('identificador inválido é rejeitado antes de consultar o banco',async()=>{
 await assert.rejects(getParticipationReport(env,{id:7,role:'admin'},{start:'2026-10-01',end:'2026-10-31',memberId:'invalido'}),e=>e.status===400);
});
