import { calculateParticipation } from '../domain/report-indicators.js';

export async function getParticipationReport(env, user, { start, end, memberId } = {}) {
  const isAdmin = user.role === 'admin';
  const target = isAdmin && memberId ? Number(memberId) : Number(user.id);
  // Solicitações de terceiros nunca ampliam o escopo de um integrante comum.
  if (!isAdmin && memberId != null && Number(memberId) !== Number(user.id)) {
    throw Object.assign(new Error('Acesso negado.'), { status: 403 });
  }
  if (!Number.isSafeInteger(target) || target < 1) throw Object.assign(new Error('Integrante inválido.'), { status: 400 });
  const rows = await env.DB.prepare(`
    SELECT ta.event_id,ta.user_id,ta.role_id,ta.status AS assignment_status,
           COALESCE(c.status,'pending') AS closure_status,
           a.status AS attendance_status
      FROM team_assignments ta
      JOIN events e ON e.id=ta.event_id
      LEFT JOIN event_attendance_closures c ON c.event_id=ta.event_id
      LEFT JOIN event_attendance a ON a.event_id=ta.event_id AND a.user_id=ta.user_id
     WHERE ta.user_id=? AND e.event_date>=? AND e.event_date<=?
     ORDER BY e.event_date,ta.role_id
  `).bind(target,start,end).all();
  return { memberId:target, start, end, indicators:calculateParticipation(rows.results || []) };
}
