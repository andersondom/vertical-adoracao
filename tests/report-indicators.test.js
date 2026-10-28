import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateParticipation } from '../src/domain/report-indicators.js';
const row = (role, closure='closed', attendance='present') => ({event_id:1,user_id:7,role_id:role,assignment_status:'confirmed',closure_status:closure,attendance_status:attendance});
test('múltiplas funções contam uma presença por evento',()=>{
 const result=calculateParticipation([row(1),row(2)]);
 assert.equal(result.functions,2);
 assert.equal(result.commitments,1);
 assert.equal(result.presences,1);
 assert.equal(result.attendanceRate,100);
});
test('fechamento pendente não vira ausência nem presença',()=>{
 const result=calculateParticipation([row(1,'pending',null)]);
 assert.equal(result.pending,1);
 assert.equal(result.presences,0);
 assert.equal(result.attendanceRate,null);
});
test('ausências justificadas são separadas',()=>{
 const result=calculateParticipation([row(1,'closed','absent_justified')]);
 assert.equal(result.justifiedAbsences,1);
 assert.equal(result.attendanceRate,0);
});
test('sem compromissos não gera taxa artificial',()=>{
 assert.equal(calculateParticipation([]).attendanceRate,null);
});

test('escalações propostas não entram nas métricas',()=>{
 const result=calculateParticipation([{...row(1),assignment_status:'proposed'}]);
 assert.equal(result.events,0);
 assert.equal(result.commitments,0);
 assert.equal(result.functions,0);
 assert.equal(result.attendanceRate,null);
});
test('eventos distintos com presença e ausência calculam 50%',()=>{
 const result=calculateParticipation([
  row(1),
  {...row(1,'closed','absent_unjustified'),event_id:2}
 ]);
 assert.equal(result.events,2);
 assert.equal(result.presences,1);
 assert.equal(result.unjustifiedAbsences,1);
 assert.equal(result.attendanceRate,50);
});
test('compromissos ainda pendentes não reduzem taxa de frequência',()=>{
 const result=calculateParticipation([
  row(1),
  {...row(1,'pending',null),event_id:2}
 ]);
 assert.equal(result.pending,1);
 assert.equal(result.attendanceRate,100);
});
