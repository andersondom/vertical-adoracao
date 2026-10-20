import test from "node:test";
import assert from "node:assert/strict";
import { appHtml } from "../src/web/app.js";

test("botao de evento chama funcao propria, sem conflito com Document.createEvent", () => {
  const html = appHtml();
  assert.match(html, /onclick="createScheduleEvent\(\)"/);
  assert.match(html, /async function createScheduleEvent\(\)/);
  assert.doesNotMatch(html, /onclick="createEvent\(\)"/);
  assert.doesNotMatch(html, /(?:async )?function createEvent\(\)/);
});
