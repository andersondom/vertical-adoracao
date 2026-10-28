// Política de autorização para a futura delegação por evento.
// Este módulo não amplia permissões das rotas existentes até a aprovação do fluxo.
const denied = () => Object.assign(new Error('Acesso negado.'), { status: 403 });

export async function canManageEventAttendance(env, actor, eventId) {
  if (!actor || actor.active === 0) return false;
  if (actor.role === 'admin') return true;
  if (!Number.isSafeInteger(Number(actor.id)) || Number(actor.id) <= 0 ||
      !Number.isSafeInteger(Number(eventId)) || Number(eventId) <= 0) return false;
  // Somente a indicação explícita de líder na escala do próprio evento autoriza.
  // Exige compromisso ativo; não utiliza papel global nem nome de função.
  const row = await env.DB.prepare(`
    SELECT 1 AS allowed FROM team_assignments
    WHERE event_id=? AND user_id=? AND is_leader=1
      AND status IN ('confirmed','reserved')
    LIMIT 1`).bind(Number(eventId),Number(actor.id)).first();
  return Boolean(row);
}

export async function requireEventAttendanceManager(env, actor, eventId) {
  if (!(await canManageEventAttendance(env, actor, eventId))) throw denied();
}
