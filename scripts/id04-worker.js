import { saveAttendance, closeAttendance } from '../src/db/attendance.js';

const reply=(body,status=200)=>new Response(JSON.stringify(body,null,2),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(!['localhost','127.0.0.1'].includes(url.hostname))return reply({ok:false,error:'Somente localhost'},403);
  if(request.method!=='POST'||url.pathname!=='/id04')return reply({ok:false,error:'Use POST /id04'},404);
  try{
   const actor=await env.DB.prepare("SELECT id,role,active FROM users WHERE email='id01-admin@vertical.invalid'").first();
   const member=await env.DB.prepare("SELECT id FROM users WHERE email='id01-integrante@vertical.invalid'").first();
   const extra=await env.DB.prepare("SELECT id FROM users WHERE email='id03-integrante@vertical.invalid'").first();
   const event=await env.DB.prepare("SELECT id FROM events WHERE event_date='2099-01-11'").first();
   if(!actor||!member||!extra||!event||actor.role!=='admin'||actor.active!==1)return reply({ok:false,error:'Fixtures ID01/ID03 ausentes; nenhuma escrita realizada'},409);
   const current=await env.DB.prepare('SELECT status,justification FROM event_attendance WHERE event_id=? AND user_id=?').bind(event.id,member.id).first();
   const pending=await env.DB.prepare('SELECT status FROM event_attendance WHERE event_id=? AND user_id=?').bind(event.id,extra.id).first();
   const closure=await env.DB.prepare('SELECT status FROM event_attendance_closures WHERE event_id=?').bind(event.id).first();
   const active=await env.DB.prepare("SELECT COUNT(DISTINCT user_id) AS total FROM team_assignments WHERE event_id=? AND status IN ('confirmed','reserved')").bind(event.id).first();
   const assignedExtra=await env.DB.prepare("SELECT 1 AS ok FROM team_assignments WHERE event_id=? AND user_id=? AND status='confirmed' LIMIT 1").bind(event.id,extra.id).first();
   if(current?.status!=='absent_justified'||pending||closure?.status==='closed'||Number(active?.total)!==2||!assignedExtra)return reply({ok:false,error:'Estado inicial ID04 inesperado; nenhuma escrita realizada',current,pending,closure,active},409);
   const auditClosedBefore=await env.DB.prepare("SELECT COUNT(*) AS total FROM audit_log WHERE actor_user_id=? AND action='ATTENDANCE_CLOSED' AND json_extract(details,'$.eventId')=?").bind(actor.id,event.id).first();
   const auditCorrectedBefore=await env.DB.prepare("SELECT COUNT(*) AS total FROM audit_log WHERE actor_user_id=? AND action='ATTENDANCE_CORRECTED' AND json_extract(details,'$.eventId')=? AND json_extract(details,'$.userId')=?").bind(actor.id,event.id,member.id).first();
   const historyBefore=await env.DB.prepare('SELECT COUNT(*) AS total FROM event_attendance_history WHERE event_id=? AND user_id=?').bind(event.id,member.id).first();
   const fill=await saveAttendance(env,actor,{eventId:event.id,userId:extra.id,status:'present',justification:'',reason:'ID04 - completar presenca pendente'});
   const missing=await env.DB.prepare("SELECT COUNT(DISTINCT ta.user_id) AS total FROM team_assignments ta LEFT JOIN event_attendance a ON a.event_id=ta.event_id AND a.user_id=ta.user_id WHERE ta.event_id=? AND ta.status IN ('confirmed','reserved') AND a.user_id IS NULL").bind(event.id).first();
   if(Number(missing?.total)!==0)return reply({ok:false,error:'Presencas ainda incompletas; encerramento nao tentado',missing},409);
   const close=await closeAttendance(env,actor,event.id);
   const closureAfter=await env.DB.prepare('SELECT status,closed_by FROM event_attendance_closures WHERE event_id=?').bind(event.id).first();
   const correctionReason='ID04 - correcao apos encerramento';
   const corrected=await saveAttendance(env,actor,{eventId:event.id,userId:member.id,status:'present',justification:'',reason:correctionReason});
   const final=await env.DB.prepare('SELECT status,justification,updated_by FROM event_attendance WHERE event_id=? AND user_id=?').bind(event.id,member.id).first();
   const history=await env.DB.prepare('SELECT previous_status,new_status,previous_justification,new_justification,reason,actor_user_id FROM event_attendance_history WHERE event_id=? AND user_id=? ORDER BY id DESC LIMIT 1').bind(event.id,member.id).first();
   const historyAfter=await env.DB.prepare('SELECT COUNT(*) AS total FROM event_attendance_history WHERE event_id=? AND user_id=?').bind(event.id,member.id).first();
   const auditClosedAfter=await env.DB.prepare("SELECT COUNT(*) AS total FROM audit_log WHERE actor_user_id=? AND action='ATTENDANCE_CLOSED' AND json_extract(details,'$.eventId')=?").bind(actor.id,event.id).first();
   const auditCorrectedAfter=await env.DB.prepare("SELECT COUNT(*) AS total FROM audit_log WHERE actor_user_id=? AND action='ATTENDANCE_CORRECTED' AND json_extract(details,'$.eventId')=? AND json_extract(details,'$.userId')=?").bind(actor.id,event.id,member.id).first();
   const checks={
    pendingRecorded:fill.ok===true&&Number(missing.total)===0,
    closure:close.ok===true&&closureAfter?.status==='closed'&&closureAfter.closed_by===actor.id,
    correction:corrected.ok===true&&corrected.correction===true&&final?.status==='present'&&final.justification===null&&final.updated_by===actor.id,
    history:history?.previous_status==='absent_justified'&&history.new_status==='present'&&history.previous_justification===current.justification&&history.new_justification===null&&history.reason===correctionReason&&history.actor_user_id===actor.id&&Number(historyAfter.total)===Number(historyBefore.total)+1,
    audit:Number(auditClosedAfter.total)===Number(auditClosedBefore.total)+1&&Number(auditCorrectedAfter.total)===Number(auditCorrectedBefore.total)+1
   };
   const ok=Object.values(checks).every(Boolean);
   return reply({ok,checks,eventId:event.id},ok?200:500);
  }catch(error){return reply({ok:false,error:String(error?.message||error)},500);}
 }
};
