import { closeAttendance } from '../src/db/attendance.js';

const reply=(data,status=200)=>new Response(JSON.stringify(data,null,2),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(!['127.0.0.1','localhost'].includes(url.hostname))return reply({ok:false,error:'Somente localhost'},403);
  if(request.method!=='POST'||url.pathname!=='/id03')return reply({ok:false,error:'Use POST /id03'},404);
  try {
   const actor=await env.DB.prepare("SELECT id,role,active FROM users WHERE email='id01-admin@vertical.invalid'").first();
   const member=await env.DB.prepare("SELECT id FROM users WHERE email='id01-integrante@vertical.invalid'").first();
   const event=await env.DB.prepare("SELECT id FROM events WHERE event_date='2099-01-11'").first();
   if(!actor||!member||!event||actor.role!=='admin'||actor.active!==1)return reply({ok:false,error:'Fixture ID01 ausente'},409);
   const active=await env.DB.prepare("SELECT COUNT(DISTINCT user_id) AS total FROM team_assignments WHERE event_id=? AND status IN ('confirmed','reserved')").bind(event.id).first();
   const missing=await env.DB.prepare("SELECT COUNT(DISTINCT ta.user_id) AS total FROM team_assignments ta LEFT JOIN event_attendance a ON a.event_id=ta.event_id AND a.user_id=ta.user_id WHERE ta.event_id=? AND ta.status IN ('confirmed','reserved') AND a.user_id IS NULL").bind(event.id).first();
   const closureBefore=await env.DB.prepare('SELECT status FROM event_attendance_closures WHERE event_id=?').bind(event.id).first();
   if(Number(active?.total)!==1||Number(missing?.total)!==0||closureBefore?.status==='closed')return reply({ok:false,error:'Precondicao: apenas integrante ID01 escalado, com presenca registrada, e evento aberto',active,missing,closureBefore},409);
   // Introduz outro integrante ficticio, ainda sem registro de presenca, sem tocar em ID01/ID02.
   await env.DB.prepare("INSERT OR IGNORE INTO users(name,email,password_hash,password_salt,role,active) VALUES ('ID03 Integrante Teste','id03-integrante@vertical.invalid','NOT_A_LOGIN_HASH','ID03_ONLY','member',1)").run();
   const extra=await env.DB.prepare("SELECT id FROM users WHERE email='id03-integrante@vertical.invalid'").first();
   const role=await env.DB.prepare('SELECT id FROM ministry_roles ORDER BY id LIMIT 1').first();
   if(!extra||!role)return reply({ok:false,error:'Papel de ministerio ou integrante ficticio ausente'},409);
   await env.DB.prepare("INSERT OR IGNORE INTO team_assignments(event_id,user_id,role_id,status,is_leader) VALUES (?,?,?,'confirmed',0)").bind(event.id,extra.id,role.id).run();
   const existing=await env.DB.prepare('SELECT status FROM event_attendance WHERE event_id=? AND user_id=?').bind(event.id,extra.id).first();
   if(existing)return reply({ok:false,error:'Integrante ID03 ja tem presenca registrada; teste abortado'},409);
   const missingNow=await env.DB.prepare("SELECT COUNT(DISTINCT ta.user_id) AS total FROM team_assignments ta LEFT JOIN event_attendance a ON a.event_id=ta.event_id AND a.user_id=ta.user_id WHERE ta.event_id=? AND ta.status IN ('confirmed','reserved') AND a.user_id IS NULL").bind(event.id).first();
   const auditBefore=await env.DB.prepare("SELECT COUNT(*) AS total FROM audit_log WHERE actor_user_id=? AND action='ATTENDANCE_CLOSED' AND json_extract(details,'$.eventId')=?").bind(actor.id,event.id).first();
   let rejected=false,errorStatus=null,errorMessage=null;
   try { await closeAttendance(env,actor,event.id); }
   catch(error){errorStatus=error?.status;errorMessage=String(error?.message||error);rejected=errorStatus===409;}
   const closureAfter=await env.DB.prepare('SELECT status FROM event_attendance_closures WHERE event_id=?').bind(event.id).first();
   const auditAfter=await env.DB.prepare("SELECT COUNT(*) AS total FROM audit_log WHERE actor_user_id=? AND action='ATTENDANCE_CLOSED' AND json_extract(details,'$.eventId')=?").bind(actor.id,event.id).first();
   const checks={
    missingAttendance:Number(missingNow?.total)===1,
    closureRejected:rejected,
    noClosureWritten:(closureAfter?.status||null)===(closureBefore?.status||null),
    noClosureAudit:Number(auditAfter?.total)===Number(auditBefore?.total)
   };
   const ok=Object.values(checks).every(Boolean);
   return reply({ok,checks,errorStatus,errorMessage,eventId:event.id},ok?200:500);
  }catch(error){return reply({ok:false,error:String(error?.message||error)},500);}
 }
};
