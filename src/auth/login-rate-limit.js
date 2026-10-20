const WINDOW_SECONDS = 15 * 60;
const MAX_FAILURES = 5;
const LOCK_SECONDS = 15 * 60;

export async function loginIdentityHash(email, ip = "") {
  const bytes = new TextEncoder().encode(email.toLowerCase() + "\n" + ip);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}

export async function isLoginBlocked(db, key, now = Math.floor(Date.now() / 1000)) {
  const row = await db.prepare(
    "SELECT locked_until FROM login_attempts WHERE identity_hash=?"
  ).bind(key).first();
  return Number(row?.locked_until || 0) > now;
}

export async function recordLoginFailure(db, key, now = Math.floor(Date.now() / 1000)) {
  // UPSERT atomico evita perda de incrementos em requisicoes simultaneas.
  await db.prepare(`
    INSERT INTO login_attempts(identity_hash,failed_count,window_started_at,locked_until)
    VALUES(?,1,?,0)
    ON CONFLICT(identity_hash) DO UPDATE SET
      failed_count=CASE
        WHEN login_attempts.window_started_at <= ? THEN 1
        ELSE login_attempts.failed_count+1 END,
      window_started_at=CASE
        WHEN login_attempts.window_started_at <= ? THEN excluded.window_started_at
        ELSE login_attempts.window_started_at END,
      locked_until=CASE
        WHEN login_attempts.window_started_at <= ? THEN 0
        WHEN login_attempts.failed_count+1 >= ? THEN ?
        ELSE login_attempts.locked_until END
  `).bind(key,now,now-WINDOW_SECONDS,now-WINDOW_SECONDS,now-WINDOW_SECONDS,MAX_FAILURES,now+LOCK_SECONDS).run();
}

export async function clearLoginFailures(db, key) {
  await db.prepare("DELETE FROM login_attempts WHERE identity_hash=?").bind(key).run();
}
