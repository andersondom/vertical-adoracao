import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.BROWSER_BASE_URL || "http://127.0.0.1:8787";
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto(base + "/login");
  const result = await page.evaluate(async () => {
    const get = await fetch("/logout", { method: "GET" });
    const post = await fetch("/logout", { method: "POST" });
    return { getStatus: get.status, postStatus: post.status, postUrl: post.url };
  });
  assert.equal(result.getStatus, 405, "GET /logout must not end a session");
  assert.equal(result.postStatus, 200, "same-origin POST must follow logout redirect to login");
  assert.equal(new URL(result.postUrl).pathname, "/login");
  console.log("Chromium: GET /logout blocked; same-origin POST redirects to login.");
} finally {
  await browser.close();
}
