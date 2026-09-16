import { parseCookies } from "./cookies.js";
import { randomToken } from "./crypto.js";

const SESSION_COOKIE = "louvor_session";
const SESSION_DAYS = 30;

export async function getAuth(request, env) {
  const cookies = parseCookies(request.headers.get("Cookie") || "");
  const sessionId = cookies[SESSION_COOKIE];

  if (!sessionId) return null;

  const row = await env.DB.prepare(
    `SELECT s.id AS session_id,s.expires_at,
            u.id,u.name,u.email,u.role,u.active
     FROM sessions s
     JOIN users u ON u.id=s.user_id
     WHERE s.id=?`
  ).bind(sessionId).first();

  if (!row || !row.active || new Date(row.expires_at) <= new Date()) {
    if (sessionId) {
      await env.DB.prepare(
        "DELETE FROM sessions WHERE id=?"
      ).bind(sessionId).run();
    }

    return null;
  }

  return {
    user: {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role
    }
  };
}

export async function createSessionResponse(env, userId, payload) {
  const sessionId = randomToken(32);
  const expires = new Date(
    Date.now() + SESSION_DAYS * 86400000
  ).toISOString();

  await env.DB.prepare(
    "INSERT INTO sessions(id,user_id,expires_at) VALUES(?,?,?)"
  ).bind(sessionId, userId, expires).run();

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "Set-Cookie": `${SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`
    }
  });
}

export async function logout(request, env) {
  const cookies = parseCookies(request.headers.get("Cookie") || "");
  const sessionId = cookies[SESSION_COOKIE];

  if (sessionId) {
    await env.DB.prepare(
      "DELETE FROM sessions WHERE id=?"
    ).bind(sessionId).run();
  }

  return new Response(null, {
    status: 302,
    headers: {
      "Location": "/",
      "Set-Cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
    }
  });
}
