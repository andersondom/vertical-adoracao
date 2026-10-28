import { canManageEventAttendance, requireEventAttendanceManager } from '../src/auth/event-attendance-policy.js';
import { saveAttendance, closeAttendance } from '../src/db/attendance.js';
const reply=(data,status=200)=>new Response(JSON.stringify(data,null,2),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(!['localhost','127.0.0.1'].includes(url.hostname))return reply({ok:false,error:'Somente localhost'},403);
  if(request.method!=='POST'||url.pathname!=='/id05')return reply({ok:false,error:'Use POST /id05'},404);
  try {
   const event=await env.DB.prepare("SELECT id FROM events WHERE event_date='2099-01-11'").first();
   const member=await env.DB.prepare("SELECT id,role,active FROM users WHERE email='id01-integrante@vertical.invalid'").first();
   const admin=await env.DB.prepare("SELECT id,role,active FROM users WHERE email='id01-admin@vertical.invalid'").first();
   if(!event||!member||!admin)return reply({ok:false,error:'Fixtures ausentes'},409);
   const closure=await env.DB.prepare('SELECT status FROM event_attendance_closures WHERE event_id=?').bind(event.id).first();
   if(closure?.status!=='closed')return reply({ok:false,error:'ID04 precisa ter encerrado o evento'},409);
   const assignment=await env.DB.prepare("SELECT role_id,is_leader,status FROM team_assignments WHERE event_id=? AND user_id=? AND status='confirmed' LIMIT 1").bind(event.id,member.id).first();
   if(!assignment)return reply({ok:false,error:'Escala ativa ausente'},409);
   if(assignment.is_leader!==0)return reply({ok:false,error:'ID05 exige liderança inicialmente desativada'},409);
   await env.DB.prepare("UPDATE team_assignments SET is_leader=1 WHERE event_id=? AND user_id=? AND role_id=?").bind(event.id,member.id,assignment.role_id).run();
   const before=await canManageEventAttendance(env,member,event.id);
   if(!before)return reply({ok:false,error:'Liderança não concedeu acesso; revogação não tentada'},409);
   await env.DB.prepare("UPDATE team_assignments SET is_leader=0 WHERE event_id=? AND user_id=? AND role_id=?").bind(event.id,member.id,assignment.role_id).run();
   const after=await canManageEventAttendance(env,member,event.id);
   let readDenied=false,writeDenied=false,closeDenied=false;
   try{await requireEventAttendanceManager(env,member,event.id)}catch(e){readDenied=e.status===403}
   try{await saveAttendance(env,member,{eventId:event.id,userId:member.id,status:'present',reason:'ID05 teste de bloqueio'})}catch(e){writeDenied=e.status===403}
   try{await closeAttendance(env,member,event.id)}catch(e){closeDenied=e.status===403}
   const adminAllowed=await canManageEventAttendance(env,admin,event.id);
   const checks={accessBeforeRevocation:before,accessRevoked:after===false,readDenied,writeDenied,closeDenied,adminPreserved:adminAllowed===true};
   const ok=Object.values(checks).every(Boolean);
   return reply({ok,checks,eventId:event.id},ok?200:500);
  }catch(e){return reply({ok:false,error:String(e?.message||e)},500)}
 }
};
