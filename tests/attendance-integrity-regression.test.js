import test from 'node:test';
import assert from 'node:assert/strict';
import { saveAttendance, closeAttendance } from '../src/db/attendance.js';

function fixture({ previous=null, closed=false, assigned=true, active=1, missing=0 }={}) {
  const batches=[];
  const env={ DB:{
    prepare(sql) {
      return {sql, bind(...values) {this.values=values;return this;},
        async first() {
          if (sql.includes('FROM events')) return {id:10};
          if (sql.includes('FROM team_assignments') && sql.includes('LIMIT 1')) return assigned ? {ok:1}:null;
          if (sql.includes('FROM event_attendance WHERE')) return previous;
          if (sql.includes('FROM event_attendance_closures')) return closed?{status:'closed'}:null;
          if (sql.includes('COUNT(DISTINCT user_id)')) return {total:active};
          if (sql.includes('COUNT(DISTINCT')) return {total:missing};
          throw Error('Unexpected SQL: '+sql);
        }};
    },
    async batch(statements) {batches.push(statements);return statements.map(()=>({success:true}));}
  }};
  return {env,batches};
}
const admin={id:2,role:'admin',active:1};

test('new presence records attendance, history and audit together',async()=>{
  const {env,batches}=fixture();
  const r=await saveAttendance(env,admin,{eventId:10,userId:5,status:'present',reason:'Conferencia'});
  assert.deepEqual(r,{ok:true,correction:false});
  assert.equal(batches.length,1);
  const [record,history,audit]=batches[0];
  assert.match(record.sql,/INSERT INTO event_attendance\(/);
  assert.match(history.sql,/INSERT INTO event_attendance_history/);
  assert.deepEqual(history.values,[10,5,null,'present',null,null,'Conferencia',2]);
  assert.equal(audit.values[1],'ATTENDANCE_RECORDED');
});

test('closed event correction retains previous values and correction actor',async()=>{
  const {env,batches}=fixture({closed:true,previous:{status:'present',justification:null}});
  const r=await saveAttendance(env,admin,{eventId:10,userId:5,status:'absent_justified',justification:'Saude',reason:'Correcao posterior'});
  assert.equal(r.correction,true);
  assert.deepEqual(batches[0][1].values,[10,5,'present','absent_justified',null,'Saude','Correcao posterior',2]);
  assert.equal(batches[0][2].values[1],'ATTENDANCE_CORRECTED');
});

test('missing assigned member rejects write without batch',async()=>{
  const f=fixture({assigned:false});
  await assert.rejects(saveAttendance(f.env,admin,{eventId:10,userId:5,status:'present',reason:'Conferencia'}),e=>e.status===409);
  assert.equal(f.batches.length,0);
});

test('invalid status and overlong reason reject without write',async()=>{
  const f=fixture();
  await assert.rejects(saveAttendance(f.env,admin,{eventId:10,userId:5,status:'unknown',reason:'Conferencia'}),e=>e.status===400);
  await assert.rejects(saveAttendance(f.env,admin,{eventId:10,userId:5,status:'present',reason:'x'.repeat(1001)}),e=>e.status===400);
  assert.equal(f.batches.length,0);
});

test('closure rejects empty team and incomplete attendance',async()=>{
  for(const options of [{active:0},{missing:1}]) {
    const f=fixture(options);
    await assert.rejects(closeAttendance(f.env,admin,10),e=>e.status===409);
    assert.equal(f.batches.length,0);
  }
});

test('closing already closed event does not overwrite closure or audit',async()=>{
  const f=fixture({closed:true});
  await assert.rejects(closeAttendance(f.env,admin,10),e=>e.status===409);
  assert.equal(f.batches.length,0);
});

test('valid closure writes closure and audit in one batch',async()=>{
  const f=fixture();
  assert.deepEqual(await closeAttendance(f.env,admin,10),{ok:true});
  assert.equal(f.batches.length,1);
  assert.equal(f.batches[0].length,2);
  assert.equal(f.batches[0][1].values[1],'ATTENDANCE_CLOSED');
});
