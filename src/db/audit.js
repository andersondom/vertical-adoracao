export async function logAudit(env, actorUserId, action, details = "") {
  await env.DB.prepare(
    "INSERT INTO audit_log(actor_user_id,action,details) VALUES(?,?,?)"
  )
    .bind(actorUserId || null, action, String(details || ""))
    .run();
}
