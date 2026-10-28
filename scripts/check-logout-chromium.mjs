import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.BROWSER_BASE_URL || "http://127.0.0.1:8787";
const fixtureSession = "chromium-local-fixture-session";
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(base + "/login");

  // Fixture exists only in the local D1 database, provisioned by the CI workflow.
  await context.addCookies([{ name: "louvor_session", value: fixtureSession, url: base, httpOnly: true, sameSite: "Lax" }]);
  const before = await page.evaluate(async () => {
    const me = await fetch("/api/me");
    return { status: me.status, body: await me.json() };
  });
  assert.equal(before.status, 200, "fixture session must authenticate before logout");
  assert.equal(before.body.user.email, "integrante.test@exemplo.invalid");

  const get = await page.evaluate(async () => {
    const response = await fetch("/logout", { method: "GET", redirect: "manual" });
    return response.status;
  });
  assert.equal(get, 405, "GET /logout must not end a session");
  const afterGet = await page.evaluate(async () => (await fetch("/api/me")).status);
  assert.equal(afterGet, 200, "GET must preserve authenticated session");

  const post = await page.evaluate(async () => {
    const response = await fetch("/logout", { method: "POST" });
    return { status: response.status, url: response.url };
  });
  assert.equal(post.status, 200, "POST logout must redirect to login");
  assert.equal(new URL(post.url).pathname, "/login");

  const afterPost = await page.evaluate(async () => (await fetch("/api/me")).status);
  assert.equal(afterPost, 401, "POST logout must revoke authenticated access");
  // Reusing the original token must also fail: D1 session row was deleted.
  await context.addCookies([{ name: "louvor_session", value: fixtureSession, url: base, httpOnly: true, sameSite: "Lax" }]);
  const replay = await page.evaluate(async () => (await fetch("/api/me")).status);
  assert.equal(replay, 401, "deleted D1 session must reject replayed cookie");
  console.log("Chromium: authenticated GET preserved session; POST revoked D1 session; replay rejected.");
} finally {
  await browser.close();
}
