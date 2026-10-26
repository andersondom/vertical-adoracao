import test from "node:test";
import assert from "node:assert/strict";
import { Script } from "node:vm";
import { appHtml } from "../src/web/app.js";

test("JavaScript incorporado à página é sintaticamente válido no navegador", () => {
  const html = appHtml();
  const scripts = [...html.matchAll(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/gi)];
  assert.ok(scripts.length > 0, "A página deve conter script.");
  for (const [,source] of scripts) {
    assert.doesNotThrow(() => new Script(source), "O JavaScript embutido precisa ser válido.");
  }
});

test("montagem da equipe e confirmação administrativa existem na interface", () => {
  const html = appHtml();
  assert.match(html, /function renderSchedule\\(/);
  assert.match(html, /function approveTeam\\(/);
  assert.match(html, /function updateMemberRole\\(/);
  assert.match(html, /function updateRequirement\\(/);
});
