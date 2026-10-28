import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

const env = { DB: { prepare() { throw new Error("D1 must not be accessed by rejected requests"); } } };

test("GET /logout does not mutate session", async () => {
  const response = await worker.fetch(new Request("https://vertical.example/logout", {
    method: "GET",
    headers: { Cookie: "louvor_session=example" }
  }), env);
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "POST");
});

test("cross-origin POST /logout is forbidden", async () => {
  const response = await worker.fetch(new Request("https://vertical.example/logout", {
    method: "POST",
    headers: { Origin: "https://evil.example", Cookie: "louvor_session=example" }
  }), env);
  assert.equal(response.status, 403);
});

test("authenticated POST /logout without Origin or Referer is forbidden", async () => {
  const response = await worker.fetch(new Request("https://vertical.example/logout", {
    method: "POST",
    headers: { Cookie: "louvor_session=example" }
  }), env);
  assert.equal(response.status, 403);
});
