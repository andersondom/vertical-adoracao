import { saveAttendance } from '../src/db/attendance.js';

const json = (body, status=200) => new Response(JSON.stringify(body,null,2), {status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!['localhost','127.0.0.1'].includes(url.hostname)) return json({ok:false,error:'Somente localhost.'},403);
    if (request.method !== 'POST' || url.pathname !== '/id01') return json({ok:false,error:'Use POST /id01.'},404);
    if (!env.DB) return json({ok:false,error:'Binding DB ausente.'},500);
    try {
      const actor = await env.DB.prepare("SELECT id,role,active FROM users WHERE email='id01-admin@vertical.invalid'").first();
      const member = await env.DB.prepare("SELECT id FROM users WHERE email='id01-integrante@vertical.invalid'").first();
      const event = await env.DB.prepare("SELECT id FROM events WHERE event_date='2099-01-11'").first();
      if (!actor || !member || !event || actor.role !== 'admin' || actor.active !== 1) return json({ok:false,error:'Fixture incompleta.'},409);
      const assignment = await env.DB.prepare("SELECT 1 AS ok FROM team_assignments WHERE event_id=? AND user_id=? AND status='confirmed' LIMIT 1").bind(event.id,member.id).first();
      if (!assignment) return json({ok:false,error:'Escala ID01 ausente.'},409);
      const prior = await env.DB.prepare('SELECT status FROM event_attendance WHERE event_id=? AND user_id=?').bind(event.id,member.id).first();
      if (prior) return json({ok:false,error:'Presença ID01 já existente; teste exige estado inicial limpo. Nenhuma escrita feita.'},409);
      const historyBefore = await env.DB.prepare('SELECT COUNT(*) AS total FROM event_attendance_history WHERE event_id=? AND user_id=?').bind(event.id,member.id).first();
      const auditBefore = await env.DB.prepare("SELECT COUNT(*) AS total FROM audit_log WHERE actor_user_id=? AND action='ATTENDANCE_RECORDED' AND json_extract(details,'$.eventId')=? AND json_extract(details,'$.userId')=?").bind(actor.id,event.id,member.id).first();
      const operation = await saveAttendance(env,{id:actor.id,role:actor.role,active:actor.active},{eventId:event.id,userId:member.id,status:'present',justification:'',reason:'ID01 - registro ficticio em D1 local'});
      const attendance = await env.DB.prepare('SELECT status,justification,updated_by FROM event_attendance WHERE event_id=? AND user_id=?').bind(event.id,member.id).first();
      const history = await env.DB.prepare('SELECT previous_status,new_status,reason,actor_user_id FROM event_attendance_history WHERE event_id=? AND user_id=? ORDER BY id DESC LIMIT 1').bind(event.id,member.id).first();
      const historyAfter = await env.DB.prepare('SELECT COUNT(*) AS total FROM event_attendance_history WHERE event_id=? AND user_id=?').bind(event.id,member.id).first();
      const auditAfter = await env.DB.prepare("SELECT COUNT(*) AS total FROM audit_log WHERE actor_user_id=? AND action='ATTENDANCE_RECORDED' AND json_extract(details,'$.eventId')=? AND json_extract(details,'$.userId')=?").bind(actor.id,event.id,member.id).first();
      const checks = {
        saveAttendance:operation.ok===true && operation.correction===false,
        presence:attendance?.status==='present' && attendance.updated_by===actor.id,
        history:history?.previous_status===null && history?.new_status==='present' && history.actor_user_id===actor.id && Number(historyAfter.total)===Number(historyBefore.total)+1,
        audit:Number(auditAfter.total)===Number(auditBefore.total)+1
      };
      return json({ok:Object.values(checks).every(Boolean),checks,eventId:event.id,userId:member.id},Object.values(checks).every(Boolean)?200:500);
    } catch(error) {
      return json({ok:false,error:String(error?.message||error),status:error?.status||500},500);
    }
  }
};
