import test from 'node:test';
import assert from 'node:assert/strict';
import { saveAttendance, closeAttendance } from '../src/db/attendance.js';

const actor={id:1,role:'admin'};
const member={id:2,role:'member'};
const env={DB:{prepare(sql){
 if (!sql.includes('is_leader=1')) throw Error('Consulta inesperada.');
 return {bind(){return {async first(){return null;}}}};
}}};

test('integrante sem liderança não pode registrar presença de terceiros',async()=>{
 await assert.rejects(saveAttendance(env,member,{eventId:1,userId:2,status:'present',reason:'Registro'}),e=>e.status===403);
});
test('integrante sem liderança não pode encerrar presenças',async()=>{
 await assert.rejects(closeAttendance(env,member,1),e=>e.status===403);
});
test('status inválido é rejeitado antes do acesso ao banco',async()=>{
 await assert.rejects(saveAttendance(env,actor,{eventId:1,userId:2,status:'unknown',reason:'Registro'}),e=>e.status===400);
});
test('alteração sem motivo é rejeitada',async()=>{
 await assert.rejects(saveAttendance(env,actor,{eventId:1,userId:2,status:'present'}),e=>e.status===400);
});
test('ausência justificada exige explicação',async()=>{
 await assert.rejects(saveAttendance(env,actor,{eventId:1,userId:2,status:'absent_justified',reason:'Lançamento'}),e=>e.status===400);
});
