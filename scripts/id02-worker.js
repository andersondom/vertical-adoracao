import { saveAttendance } from '../src/db/attendance.js';

const reply=(data,status=200)=>new Response(JSON.stringify(data,null,2),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(!['127.0.0.1','localhost'].includes(url.hostname))return reply({ok:false,error:'Somente localhost'},403);
  if(request.method!=='POST'||url.pathname!=='/id02')return reply({ok:false,error:'Use POST /id02'},404);
  try{
   const actor=await env.DB.prepare("SELECT id,role,active FROM users WHERE email='id01-admin@vertical.invalid'").first();
   const member=await env.DB.prepare("SELECT id FROM users WHERE email='id01-integrante@vertical.invalid'").first();
   const event=await env.DB.prepare("SELECT id FROM events WHERE event_date='2099-01-11'").first();
   if(!actor||!member||!event||actor.role!=='admin'||actor.active!==1)return reply({ok:false,error:'Fixture ID01 ausente'},409);
   const previous=await env.DB.prepare('SELECT status,justification FROM event_attendance WHERE event_id=? AND user_id=?').bind(event.id,member.id).first();
   if(previous?.status!=='present'||previous.justification!==null)return reply({ok:false,error:'ID02 exige presenca ID01 com status present e justificativa nula; nenhuma escrita realizada',previous},409);
   const reason='ID02 - correcao ficticia de presenca';
   const justification='ID02 - ausencia justificada ficticia';
   const historyBefore=await env.DB.prepare('SELECT COUNT(*) AS total FROM event_attendance_history WHERE event_id=? AND user_id=?').bind(event.id,member.id).first();
   const auditBefore=await env.DB.prepare("SELECT COUNT(*) AS total FROM audit_log WHERE actor_user_id=? AND action='ATTENDANCE_RECORDED' AND json_extract(details,'$.eventId')=? AND json_extract(details,'$.userId')=?").bind(actor.id,event.id,member.id).first();
   const operation=await saveAttendance(env,actor,{eventId:event.id,userId:member.id,status:'absent_justified',justification,reason});
   const current=await env.DB.prepare('SELECT status,justification,updated_by FROM event_attendance WHERE event_id=? AND user_id=?').bind(event.id,member.id).first();
   const history=await env.DB.prepare('SELECT previous_status,new_status,previous_justification,new_justification,reason,actor_user_id FROM event_attendance_history WHERE event_id=? AND user_id=? ORDER BY id DESC LIMIT 1').bind(event.id,member.id).first();
   const historyAfter=await env.DB.prepare('SELECT COUNT(*) AS total FROM event_attendance_history WHERE event_id=? AND user_id=?').bind(event.id,member.id).first();
   const auditAfter=await env.DB.prepare("SELECT COUNT(*) AS total FROM audit_log WHERE actor_user_id=? AND action='ATTENDANCE_RECORDED' AND json_extract(details,'$.eventId')=? AND json_extract(details,'$.userId')=?").bind(actor.id,event.id,member.id).first();
   const checks={
    saveAttendance:operation.ok===true&&operation.correction===false,
    current:current?.status==='absent_justified'&&current.justification===justification&&current.updated_by===actor.id,
    history:history?.previous_status==='present'&&history.new_status==='absent_justified'&&history.previous_justification===null&&history.new_justification===justification&&history.reason===reason&&history.actor_user_id===actor.id&&Number(historyAfter.total)===Number(historyBefore.total)+1,
    audit:Number(auditAfter.total)===Number(auditBefore.total)+1
   };
   const ok=Object.values(checks).every(Boolean);
   return reply({ok,checks,eventId:event.id,userId:member.id},ok?200:500);
  }catch(error){return reply({ok:false,error:String(error?.message||error)},500);}
 }
};
