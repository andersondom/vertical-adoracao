import { normalizeEmail, isEmail, isPositiveInteger, isValidDate } from "../utils/validation.js";
import { hashPassword, verifyPassword } from "../auth/crypto.js";
import { getAuth, createSessionResponse, logout } from "../auth/session.js";
import { requireAdmin } from "../auth/authorization.js";
import { json } from "../utils/http.js";
import { logAudit } from "../db/audit.js";
import { getData } from "../db/schedule.js";

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
      "INSERT INTO users(name,email,password_hash,password_salt,role) VALUES(?,?,?,?, 'admin')"
    ).bind(name, email, hash, salt).run();

    const userId = result.meta.last_row_id;
    await logAudit(env, userId, "BOOTSTRAP_ADMIN", email);
    return await createSessionResponse(env, userId, { ok: true });
  }

  if (url.pathname === "/api/login" && request.method === "POST") {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");

    const user = await env.DB.prepare(
      "SELECT id,name,email,password_hash,password_salt,role,active FROM users WHERE email = ?"
    ).bind(email).first();

    if (!user || !user.active) return json({ error: "E-mail ou senha inválidos." }, 401);

    const valid = await verifyPassword(password, user.password_hash, user.password_salt);
    if (!valid) return json({ error: "E-mail ou senha inválidos." }, 401);

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
