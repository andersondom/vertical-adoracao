import test from 'node:test';
import assert from 'node:assert/strict';
import { getParticipationReport } from '../src/db/reports.js';
import { appHtml } from '../src/web/app.js';

function fixture(rows=[]) {
  const calls=[];
  const env={DB:{prepare(sql){return {bind(...args){calls.push({sql,args});return {async all(){return {results:rows};}};}};}}};
  return {env,calls};
}
const period={start:'2026-10-01',end:'2026-10-31'};

test('member can only read their own participation report',async()=>{
  const f=fixture();
  const r=await getParticipationReport(f.env,{id:5,role:'member'},period);
  assert.equal(r.memberId,5);
  assert.deepEqual(f.calls[0].args,[5,period.start,period.end]);
});

test('member cannot read another user participation report',async()=>{
  const f=fixture();
  await assert.rejects(getParticipationReport(f.env,{id:5,role:'member'},{...period,memberId:6}),e=>e.status===403);
  assert.equal(f.calls.length,0);
});

test('administrator may read another member participation report',async()=>{
  const f=fixture();
  const r=await getParticipationReport(f.env,{id:1,role:'admin'},{...period,memberId:6});
  assert.equal(r.memberId,6);
  assert.deepEqual(f.calls[0].args,[6,period.start,period.end]);
});

test('admin-only tabs remain guarded in rendered interface',()=>{
  const html=appHtml();
  assert.match(html,/if\(\(v==='users'\|\|v==='settings'\)&&ME\.role!=='admin'\)return/);
  assert.match(html,/button\.classList\.toggle\('hidden',ME\.role!=='admin'\)/);
});

test('attendance tab is available through delegated event logic',()=>{
  const html=appHtml();
  assert.match(html,/function leaderEventIds\(\)/);
  assert.match(html,/function canAccessAttendance\(\)/);
  assert.match(html,/updateAttendanceNavigation\(\)/);
});
