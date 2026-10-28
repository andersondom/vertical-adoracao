import { logAudit } from './audit.js';

const allowed = new Set(['present','absent_justified','absent_unjustified']);
const fail = (message,status=400) => { throw Object.assign(new Error(message),{status}); };

export async function saveAttendance(env, actor, {eventId,userId,status,justification,reason}) {
  if (actor.role !== 'admin') fail('Acesso negado.',403);
  if (!allowed.has(status)) fail('Situação de presença inválida.');
  const why=String(reason||'').trim();
  const note=String(justification||'').trim();
  if (!why) fail('Informe a justificativa da alteração.');
  if (why.length>1000 || note.length>2000) fail('Texto excede o limite permitido.');
  const event=await env.DB.prepare('SELECT id FROM events WHERE id=?').bind(eventId).first();
  if (!event) fail('Evento não encontrado.',404);
  const assignment=await env.DB.prepare(`SELECT 1 AS ok FROM team_assignments
    WHERE event_id=? AND user_id=? AND status IN ('confirmed','reserved') LIMIT 1`).bind(eventId,userId).first();
  if (!assignment) fail('Integrante sem compromisso ativo neste evento.',409);
  const previous=await env.DB.prepare('SELECT status,justification FROM event_attendance WHERE event_id=? AND user_id=?').bind(eventId,userId).first();
  const closure=await env.DB.prepare('SELECT status FROM event_attendance_closures WHERE event_id=?').bind(eventId).first();
  const correction=closure?.status==='closed';
  // Histórico e alteração são gravados no mesmo lote transacional D1.
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO event_attendance(event_id,user_id,status,justification,updated_by,updated_at)
      VALUES(?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(event_id,user_id) DO UPDATE SET
      status=excluded.status,justification=excluded.justification,updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP`)
      .bind(eventId,userId,status,note||null,actor.id),
    env.DB.prepare(`INSERT INTO event_attendance_history(event_id,user_id,previous_status,new_status,
      previous_justification,new_justification,reason,actor_user_id)
      VALUES(?,?,?,?,?,?,?,?)`).bind(eventId,userId,previous?.status||null,status,previous?.justification||null,note||null,why,actor.id)
  ]);
  await logAudit(env,actor.id,correction?'ATTENDANCE_CORRECTED':'ATTENDANCE_RECORDED',JSON.stringify({eventId,userId,status}));
  return {ok:true,correction};
}

export async function closeAttendance(env,actor,eventId) {
  if(actor.role!=='admin') fail('Acesso negado.',403);
  const event=await env.DB.prepare('SELECT id FROM events WHERE id=?').bind(eventId).first();
  if(!event) fail('Evento não encontrado.',404);
  const missing=await env.DB.prepare(`SELECT COUNT(DISTINCT ta.user_id) AS total FROM team_assignments ta
    LEFT JOIN event_attendance a ON a.event_id=ta.event_id AND a.user_id=ta.user_id
    WHERE ta.event_id=? AND ta.status IN ('confirmed','reserved') AND a.user_id IS NULL`).bind(eventId).first();
  if(Number(missing?.total||0)>0) fail('Existem integrantes escalados sem presença ou ausência registrada.',409);
  const current=await env.DB.prepare('SELECT status FROM event_attendance_closures WHERE event_id=?').bind(eventId).first();
  if(current?.status==='closed') fail('Presenças já encerradas.',409);
  await env.DB.prepare(`INSERT INTO event_attendance_closures(event_id,status,closed_by,closed_at,updated_at)
    VALUES(?,'closed',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    ON CONFLICT(event_id) DO UPDATE SET status='closed',closed_by=excluded.closed_by,
    closed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP`).bind(eventId,actor.id).run();
  await logAudit(env,actor.id,'ATTENDANCE_CLOSED',JSON.stringify({eventId}));
  return {ok:true};
}
