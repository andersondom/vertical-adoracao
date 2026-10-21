import { normalizeEmail, isEmail, isPositiveInteger, isValidDate } from "../utils/validation.js";
import { hashPassword, verifyPassword } from "../auth/crypto.js";
import { getAuth, createSessionResponse, logout } from "../auth/session.js";
import { requireAdmin } from "../auth/authorization.js";
import { json } from "../utils/http.js";
import { logAudit } from "../db/audit.js";
import { getData } from "../db/schedule.js";
import { suggestTeam } from "../domain/team-suggestions.js";
import { loginIdentityHash, isLoginBlocked, recordLoginFailure, clearLoginFailures } from "../auth/login-rate-limit.js";

export async function handleApi(request, env, url) {
  if (url.pathname === "/api/bootstrap-status" && request.method === "GET") {
    const row = await env.DB.prepare("SELECT COUNT(*) AS total FROM users").first();
    return json({ needsBootstrap: Number(row?.total || 0) === 0 });
  }

  if (url.pathname === "/api/bootstrap" && request.method === "POST") {
    const count = await env.DB.prepare("SELECT COUNT(*) AS total FROM users").first();
    if (Number(count?.total || 0) !== 0) return json({ error: "Administrador inicial já configurado." }, 409);

    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");

    if (!name || !isEmail(email) || password.length < 8) {
      return json({ error: "Informe nome, e-mail válido e senha com pelo menos 8 caracteres." }, 400);
    }

    const { hash, salt } = await hashPassword(password);
    const result = await env.DB.prepare(
      "INSERT INTO users(name,email,password_hash,password_salt,role) SELECT ?,?,?,?,'admin' WHERE NOT EXISTS (SELECT 1 FROM users)"
    ).bind(name, email, hash, salt).run();

    if (Number(result.meta?.changes || 0) !== 1) {
      return json({ error: "Administrador inicial já configurado." }, 409);
    }
    const userId = result.meta.last_row_id;
    await logAudit(env, userId, "BOOTSTRAP_ADMIN", email);
    return await createSessionResponse(env, userId, { ok: true });
  }

  if (url.pathname === "/api/login" && request.method === "POST") {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");

    const rateKey = await loginIdentityHash(email, request.headers.get("CF-Connecting-IP") || "unknown");
    if (await isLoginBlocked(env.DB, rateKey)) return json({ error: "Muitas tentativas. Tente novamente mais tarde." }, 429);

    const user = await env.DB.prepare(
      "SELECT id,name,email,password_hash,password_salt,role,active FROM users WHERE email = ?"
    ).bind(email).first();

    if (!user || !user.active) {
      await recordLoginFailure(env.DB, rateKey);
      return json({ error: "E-mail ou senha inválidos." }, 401);
    }

    const valid = await verifyPassword(password, user.password_hash, user.password_salt);
    if (!valid) {
      await recordLoginFailure(env.DB, rateKey);
      return json({ error: "E-mail ou senha inválidos." }, 401);
    }

    await clearLoginFailures(env.DB, rateKey);

    await logAudit(env, user.id, "LOGIN", user.email);
    return await createSessionResponse(env, user.id, { ok: true });
  }

  const auth = await getAuth(request, env);
  if (!auth) return json({ error: "Não autenticado." }, 401);

  if (url.pathname === "/api/me" && request.method === "GET") {
    return json({ user: auth.user });
  }

  if (url.pathname === "/api/data" && request.method === "GET") {
    return json(await getData(env, auth.user));
  }

  if (url.pathname === "/api/availability" && request.method === "POST") {
    const settings = await env.DB.prepare("SELECT availability_open FROM schedule_settings WHERE id=1").first();
    if (!settings?.availability_open && auth.user.role !== "admin") {
      return json({ error: "O período de disponibilidade está fechado." }, 403);
    }

    const body = await request.json();
    if (!isPositiveInteger(body.eventId)) {
      return json({ error: "Evento inválido." }, 400);
    }

    const eventId = Number(body.eventId);
    const available = body.available ? 1 : 0;

    if (auth.user.role === "admin" && body.userId != null && !isPositiveInteger(body.userId)) {
      return json({ error: "Usuário inválido." }, 400);
    }

    const targetUserId =
      auth.user.role === "admin" && body.userId != null
        ? Number(body.userId)
        : auth.user.id;

    const event = await env.DB.prepare(
      "SELECT id FROM events WHERE id=?"
    ).bind(eventId).first();

    if (!event) {
      return json({ error: "Evento não encontrado." }, 404);
    }

    const targetUser = await env.DB.prepare(
      "SELECT id,active FROM users WHERE id=?"
    ).bind(targetUserId).first();

    if (!targetUser) {
      return json({ error: "Usuário não encontrado." }, 404);
    }

    if (!targetUser.active) {
      return json({ error: "O usuário está desativado." }, 400);
    }

    if (available) {
      await env.DB.prepare(
        `INSERT INTO availability(event_id,user_id,available,updated_at)
         VALUES(?,?,1,CURRENT_TIMESTAMP)
         ON CONFLICT(event_id,user_id)
         DO UPDATE SET available=1,updated_at=CURRENT_TIMESTAMP`
      ).bind(eventId, targetUserId).run();
    } else {
      await env.DB.prepare("DELETE FROM availability WHERE event_id=? AND user_id=?")
        .bind(eventId, targetUserId).run();
    }

    await logAudit(env, auth.user.id, "AVAILABILITY_UPDATE", JSON.stringify({eventId,targetUserId,available}));
    return json({ ok: true });
  }

  if (url.pathname === "/api/admin/assign" && request.method === "POST") {
    requireAdmin(auth);
    const body = await request.json();
    if (!isPositiveInteger(body.eventId)) {
      return json({ error: "Evento inválido." }, 400);
    }

    if (body.userId != null && body.userId !== "" && !isPositiveInteger(body.userId)) {
      return json({ error: "Usuário inválido." }, 400);
    }

    const eventId = Number(body.eventId);
    const userId = body.userId != null && body.userId !== ""
      ? Number(body.userId)
      : null;

    const event = await env.DB.prepare(
      "SELECT id FROM events WHERE id=?"
    ).bind(eventId).first();

    if (!event) {
      return json({ error: "Evento não encontrado." }, 404);
    }

    if (userId) {
      const user = await env.DB.prepare(
        "SELECT id,active FROM users WHERE id=?"
      ).bind(userId).first();

      if (!user) {
        return json({ error: "Usuário não encontrado." }, 404);
      }

      if (!user.active) {
        return json({ error: "O usuário está desativado." }, 400);
      }
      await env.DB.prepare(
        `INSERT INTO assignments(event_id,user_id,updated_at)
         VALUES(?,?,CURRENT_TIMESTAMP)
         ON CONFLICT(event_id)
         DO UPDATE SET user_id=excluded.user_id, updated_at=CURRENT_TIMESTAMP`
      ).bind(eventId, userId).run();
    } else {
      await env.DB.prepare("DELETE FROM assignments WHERE event_id=?").bind(eventId).run();
    }

    await logAudit(env, auth.user.id, "ASSIGNMENT_UPDATE", JSON.stringify({eventId,userId}));
    return json({ ok: true });
  }

  if (url.pathname === "/api/admin/team-assignment" && request.method === "POST") {
    requireAdmin(auth);
    const body = await request.json();
    if (!isPositiveInteger(body.eventId) || !isPositiveInteger(body.userId) ||
        !isPositiveInteger(body.roleId) || !["proposed","reserved","confirmed"].includes(body.status)) {
      return json({ error: "Escalação inválida." }, 400);
    }
    const eventId = Number(body.eventId);
    const userId = Number(body.userId);
    const roleId = Number(body.roleId);
    const isLeader = body.isLeader === true;
    const event = await env.DB.prepare("SELECT id FROM events WHERE id=?").bind(eventId).first();
    const member = await env.DB.prepare("SELECT id,active FROM users WHERE id=?").bind(userId).first();
    const role = await env.DB.prepare("SELECT id,code,active FROM ministry_roles WHERE id=?").bind(roleId).first();
    const eligible = await env.DB.prepare("SELECT 1 AS ok FROM member_roles WHERE user_id=? AND role_id=?")
      .bind(userId,roleId).first();
    const available = await env.DB.prepare("SELECT available FROM availability WHERE event_id=? AND user_id=?")
      .bind(eventId,userId).first();
    if (!event || !member || !role) return json({ error: "Evento, integrante ou função não encontrado." }, 404);
    if (!member.active || !role.active || !eligible || !available?.available) {
      return json({ error: "Integrante indisponível ou sem função habilitada." }, 409);
    }
    if (isLeader !== (role.code === "leader")) {
      return json({ error: "Liderança exige a função de líder." }, 400);
    }
    if (isLeader && body.status !== "proposed") {
      const occupied = await env.DB.prepare(
        `SELECT 1 AS ok FROM team_assignments
         WHERE event_id=? AND is_leader=1 AND status IN ('reserved','confirmed')
         AND NOT (user_id=? AND role_id=?) LIMIT 1`
      ).bind(eventId,userId,roleId).first();
      if (occupied) return json({ error: "O evento já possui um líder reservado ou confirmado." }, 409);
    }
    try {
      await env.DB.prepare(
        `INSERT INTO team_assignments(event_id,user_id,role_id,status,is_leader,updated_at)
         VALUES(?,?,?,?,?,CURRENT_TIMESTAMP)
         ON CONFLICT(event_id,user_id,role_id) DO UPDATE SET
           status=excluded.status,is_leader=excluded.is_leader,updated_at=CURRENT_TIMESTAMP`
      ).bind(eventId,userId,roleId,body.status,isLeader?1:0).run();
    } catch (error) {
      if (/UNIQUE constraint/i.test(String(error))) return json({ error: "Conflito na reserva de liderança." }, 409);
      throw error;
    }
    await logAudit(env, auth.user.id, "TEAM_ASSIGNMENT_UPDATE", JSON.stringify({eventId,userId,roleId,status:body.status,isLeader}));
    return json({ ok: true });
  }

  if (url.pathname === "/api/team-confirmation" && request.method === "POST") {
    const body = await request.json();
    if (!isPositiveInteger(body.eventId) || !isPositiveInteger(body.roleId) ||
        typeof body.confirm !== "boolean") return json({ error: "Confirmação inválida." }, 400);
    const eventId = Number(body.eventId);
    const roleId = Number(body.roleId);
    const assignment = await env.DB.prepare(
      "SELECT status FROM team_assignments WHERE event_id=? AND user_id=? AND role_id=?"
    ).bind(eventId,auth.user.id,roleId).first();
    if (!assignment) return json({ error: "Você não possui esta escalação." }, 404);
    if (!["proposed","reserved","confirmed"].includes(assignment.status)) {
      return json({ error: "Esta escalação não pode ser alterada." }, 409);
    }
    if (body.confirm && assignment.status === "proposed") return json({ error: "A escalação ainda aguarda aprovação do administrador." }, 409);
    const status = body.confirm ? "confirmed" : "declined";
    if (body.confirm) {
      const current = await env.DB.prepare(
        "SELECT is_leader FROM team_assignments WHERE event_id=? AND user_id=? AND role_id=?"
      ).bind(eventId,auth.user.id,roleId).first();
      if (current?.is_leader) {
        const leader = await env.DB.prepare(
          `SELECT 1 AS ok FROM team_assignments
           WHERE event_id=? AND is_leader=1 AND status IN ('reserved','confirmed')
           AND NOT (user_id=? AND role_id=?) LIMIT 1`
        ).bind(eventId,auth.user.id,roleId).first();
        if (leader) return json({ error: "Já existe liderança reservada ou confirmada." }, 409);
      }
    }
    try {
      await env.DB.prepare(
        "UPDATE team_assignments SET status=?,updated_at=CURRENT_TIMESTAMP WHERE event_id=? AND user_id=? AND role_id=?"
      ).bind(status,eventId,auth.user.id,roleId).run();
    } catch (error) {
      if (/UNIQUE constraint/i.test(String(error))) return json({ error: "Conflito na confirmação de liderança." }, 409);
      throw error;
    }
    await logAudit(env,auth.user.id,"TEAM_CONFIRMATION",JSON.stringify({eventId,roleId,status}));
    return json({ ok: true });
  }

  if (url.pathname === "/api/admin/team-suggestions" && request.method === "GET") {
    requireAdmin(auth);
    const rawEventId = url.searchParams.get("eventId");
    if (!isPositiveInteger(rawEventId)) return json({ error: "Evento inválido." }, 400);
    const eventId = Number(rawEventId);
    const event = await env.DB.prepare("SELECT id FROM events WHERE id=?").bind(eventId).first();
    if (!event) return json({ error: "Evento não encontrado." }, 404);

    const requirements = (await env.DB.prepare(
      `SELECT r.role_id AS roleId,r.slots,
              CASE WHEN mr.code='leader' THEN 1 ELSE 0 END AS isLeader
       FROM event_role_requirements r JOIN ministry_roles mr ON mr.id=r.role_id
       WHERE r.event_id=? AND mr.active=1 ORDER BY r.role_id`
    ).bind(eventId).all()).results.map(x=>({
      roleId: Number(x.roleId),slots:Number(x.slots),isLeader:Boolean(x.isLeader)
    }));
    const candidates = (await env.DB.prepare(
      `SELECT mr.user_id AS userId,mr.role_id AS roleId,
              u.active AS active,
              COALESCE(av.available,0) AS available,
              (SELECT COUNT(*) FROM team_assignments ta
               WHERE ta.user_id=mr.user_id AND ta.status IN ('reserved','confirmed')) AS recentAssignments
       FROM member_roles mr
       JOIN users u ON u.id=mr.user_id
       JOIN ministry_roles r ON r.id=mr.role_id AND r.active=1
       LEFT JOIN availability av ON av.user_id=mr.user_id AND av.event_id=?
       WHERE u.active=1 ORDER BY mr.user_id,mr.role_id`
    ).bind(eventId).all()).results.map(x=>({
      userId:Number(x.userId),roleId:Number(x.roleId),
      active:Boolean(x.active),available:Boolean(x.available),
      recentAssignments:Number(x.recentAssignments)
    }));
    const existing = (await env.DB.prepare(
      "SELECT user_id AS userId,role_id AS roleId,status,is_leader AS isLeader FROM team_assignments WHERE event_id=?"
    ).bind(eventId).all()).results.map(x=>({
      userId:Number(x.userId),roleId:Number(x.roleId),
      status:x.status,isLeader:Boolean(x.isLeader)
    }));
    const suggestions = suggestTeam({requirements,candidates,existing});
    return json({ eventId, suggestions, saved: false, requiresApproval: true });
  }

  if (url.pathname === "/api/admin/member-role" && request.method === "POST") {
    requireAdmin(auth);
    const body = await request.json();
    if (!isPositiveInteger(body.userId) || !isPositiveInteger(body.roleId) ||
        typeof body.enabled !== "boolean") {
      return json({ error: "Dados de função inválidos." }, 400);
    }
    const userId = Number(body.userId);
    const roleId = Number(body.roleId);
    const member = await env.DB.prepare("SELECT id,active FROM users WHERE id=?").bind(userId).first();
    const role = await env.DB.prepare("SELECT id,active FROM ministry_roles WHERE id=?").bind(roleId).first();
    if (!member || !role) return json({ error: "Integrante ou função não encontrado." }, 404);
    if (!member.active || !role.active) return json({ error: "Integrante ou função desativado." }, 400);
    if (body.enabled) {
      await env.DB.prepare("INSERT OR IGNORE INTO member_roles(user_id,role_id) VALUES(?,?)").bind(userId,roleId).run();
    } else {
      await env.DB.prepare("DELETE FROM member_roles WHERE user_id=? AND role_id=?").bind(userId,roleId).run();
    }
    await logAudit(env, auth.user.id, "MEMBER_ROLE_UPDATE", JSON.stringify({userId,roleId,enabled:body.enabled}));
    return json({ ok: true });
  }

  if (url.pathname === "/api/admin/event-requirement" && request.method === "POST") {
    requireAdmin(auth);
    const body = await request.json();
    if (!isPositiveInteger(body.eventId) || !isPositiveInteger(body.roleId) ||
        !Number.isSafeInteger(body.slots) || body.slots < 0 || body.slots > 50) {
      return json({ error: "Formação inválida." }, 400);
    }
    const eventId = Number(body.eventId);
    const roleId = Number(body.roleId);
    const event = await env.DB.prepare("SELECT id FROM events WHERE id=?").bind(eventId).first();
    const role = await env.DB.prepare("SELECT id,active FROM ministry_roles WHERE id=?").bind(roleId).first();
    if (!event || !role) return json({ error: "Evento ou função não encontrado." }, 404);
    if (!role.active) return json({ error: "Função desativada." }, 400);
    await env.DB.prepare(
      `INSERT INTO event_role_requirements(event_id,role_id,slots) VALUES(?,?,?)
       ON CONFLICT(event_id,role_id) DO UPDATE SET slots=excluded.slots`
    ).bind(eventId,roleId,body.slots).run();
    await logAudit(env, auth.user.id, "EVENT_REQUIREMENT_UPDATE", JSON.stringify({eventId,roleId,slots:body.slots}));
    return json({ ok: true });
  }

  if (url.pathname === "/api/admin/users" && request.method === "POST") {
    requireAdmin(auth);
    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");
    const role = body.role === "admin" ? "admin" : "member";

    if (!name || !isEmail(email) || password.length < 8) {
      return json({ error: "Nome, e-mail válido e senha mínima de 8 caracteres são obrigatórios." }, 400);
    }

    const exists = await env.DB.prepare("SELECT id FROM users WHERE email=?").bind(email).first();
    if (exists) return json({ error: "Já existe um usuário com esse e-mail." }, 409);

    const { hash, salt } = await hashPassword(password);
    const result = await env.DB.prepare(
      "INSERT INTO users(name,email,password_hash,password_salt,role) VALUES(?,?,?,?,?)"
    ).bind(name,email,hash,salt,role).run();

    await logAudit(env, auth.user.id, "USER_CREATE", JSON.stringify({id: result.meta.last_row_id,email,role}));
    return json({ ok: true });
  }

  if (url.pathname === "/api/admin/user-state" && request.method === "POST") {
    requireAdmin(auth);
    const body = await request.json();
    if (!isPositiveInteger(body.userId)) {
      return json({ error: "Usuário inválido." }, 400);
    }

    const userId = Number(body.userId);
    const active = body.active ? 1 : 0;

    if (userId === auth.user.id && !active) {
      return json({ error: "Você não pode desativar sua própria conta." }, 400);
    }

    const user = await env.DB.prepare(
      "SELECT id FROM users WHERE id=?"
    ).bind(userId).first();

    if (!user) {
      return json({ error: "Usuário não encontrado." }, 404);
    }

    await env.DB.prepare("UPDATE users SET active=? WHERE id=?").bind(active,userId).run();
    if (!active) await env.DB.prepare("DELETE FROM sessions WHERE user_id=?").bind(userId).run();
    await logAudit(env, auth.user.id, "USER_STATE", JSON.stringify({userId,active}));
    return json({ ok: true });
  }

  if (url.pathname === "/api/admin/password" && request.method === "POST") {
    requireAdmin(auth);
    const body = await request.json();
    if (!isPositiveInteger(body.userId)) {
      return json({ error: "Usuário inválido." }, 400);
    }

    const userId = Number(body.userId);
    const password = String(body.password || "");

    if (password.length < 8) {
      return json({ error: "A nova senha deve ter pelo menos 8 caracteres." }, 400);
    }

    const user = await env.DB.prepare(
      "SELECT id FROM users WHERE id=?"
    ).bind(userId).first();

    if (!user) {
      return json({ error: "Usuário não encontrado." }, 404);
    }

    const { hash, salt } = await hashPassword(password);
    await env.DB.prepare(
      "UPDATE users SET password_hash=?, password_salt=? WHERE id=?"
    ).bind(hash,salt,userId).run();
    await env.DB.prepare("DELETE FROM sessions WHERE user_id=?").bind(userId).run();
    await logAudit(env, auth.user.id, "PASSWORD_RESET_BY_ADMIN", String(userId));
    return json({ ok: true });
  }

  if (url.pathname === "/api/admin/settings" && request.method === "POST") {
    requireAdmin(auth);
    const body = await request.json();
    const open = body.availabilityOpen ? 1 : 0;
    await env.DB.prepare("UPDATE schedule_settings SET availability_open=? WHERE id=1").bind(open).run();
    await logAudit(env, auth.user.id, "AVAILABILITY_WINDOW", String(open));
    return json({ ok: true });
  }

  if (url.pathname === "/api/admin/event" && request.method === "POST") {
    requireAdmin(auth);
    const body = await request.json();
    const eventDate = String(body.eventDate || "");
    const dayCode = String(body.dayCode || "").trim();
    const title = String(body.title || "").trim() || null;
    const icon = String(body.icon || "🎶").trim() || "🎶";

    if (!isValidDate(eventDate) || !dayCode) {
      return json({ error: "Informe uma data válida e o código do dia." }, 400);
    }

    await env.DB.prepare(
      "INSERT INTO events(event_date,day_code,title,icon) VALUES(?,?,?,?)"
    ).bind(eventDate,dayCode,title,icon).run();
    await logAudit(env, auth.user.id, "EVENT_CREATE", JSON.stringify({eventDate,dayCode,title}));
    return json({ ok: true });
  }

  if (url.pathname === "/api/logout" && request.method === "POST") {
    return await logout(request, env);
  }

  return json({ error: "Rota não encontrada." }, 404);
}
