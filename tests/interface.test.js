import test from 'node:test';
import assert from 'node:assert/strict';
import { appHtml } from '../src/web/app.js';

const html = appHtml();

test('interface tem navegação identificada e seções preservadas', () => {
  assert.match(html, /<nav id="adminTabs"[^>]*aria-label="Seções do sistema"/);
  for (const view of ['schedule', 'users', 'settings']) {
    assert.ok(html.includes('data-view="' + view + '"'));
    assert.ok(html.includes('id="' + view + 'View"'));
  }
  assert.match(html, /classList\.toggle\('active',selected\)/);
});

test('escalas e formulários usam layout compacto e responsivo', () => {
  assert.match(html, /\.schedule-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(html, /@media\(max-width:900px\)\{\.schedule-grid\{grid-template-columns:1fr\}/);
  assert.match(html, /class="form-grid"/);
  assert.match(html, /class="span-3">Data<input id="eDate"/);
  assert.match(html, /class="span-2">Emoji<input id="eIcon"/);
  assert.match(html, /class="requirement-grid"/);
  assert.match(html, /\.requirement-grid input\[type=number\]/);
});

test('ações essenciais da escala permanecem conectadas', () => {
  for (const fn of ['setAvailability', 'assign', 'previewTeam', 'approveTeam', 'cancelTeam', 'confirmTeam', 'updateRequirement', 'createScheduleEvent']) {
    assert.ok(html.includes('function ' + fn + '('), fn + ' ausente');
  }
  assert.match(html, /\/api\/admin\/team-assignment/);
  assert.match(html, /\/api\/availability/);
});

test('interface preserva contraste de foco e movimento reduzido', () => {
  assert.match(html, /:focus-visible/);
  assert.match(html, /prefers-reduced-motion:reduce/);
});
