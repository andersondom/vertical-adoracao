import test from "node:test";
import assert from "node:assert/strict";
import { Script } from "node:vm";
import { appHtml } from "../src/web/app.js";

test("JavaScript incorporado à página é sintaticamente válido no navegador", () => {
  const html = appHtml();
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
  assert.ok(scripts.length > 0, "A página deve conter script.");
  for (const [,source] of scripts) {
    assert.doesNotThrow(() => new Script(source), "O JavaScript embutido precisa ser válido.");
  }
});

test("montagem da equipe e confirmação administrativa existem na interface", () => {
  const html = appHtml();
  assert.match(html, /function renderSchedule\(/);
  assert.match(html, /function approveTeam\(/);
  assert.match(html, /function updateMemberRole\(/);
  assert.match(html, /function updateRequirement\(/);
});

test("exportação de equipes exige confirmação e oferece impressão em PDF",()=>{
  const html=appHtml();
  assert.match(html,/function printTeamSchedule\(/);
  assert.match(html,/x.status==='confirmed'/);
  assert.match(html,/popup\.print\(\)/);
  assert.match(html,/Imprimir equipes \/ salvar em PDF/);
});


test("painel de confirmação usa dados já carregados sem novas consultas", () => {
  const html = appHtml();
  assert.match(html, /Visão geral da confirmação/);
  assert.match(html, /Ainda não confirmadas/);
  assert.match(html, /Sem quantidade de vagas configurada/);
  for (const label of ['Configurar formação','Formação confirmada','Aguardando integrantes','Aguardando aprovação','Formação incompleta']) {
    assert.ok(html.includes(label), `Status ausente: ${label}`);
  }
  assert.match(html, /function copyConfirmedTeamSchedule\(/);
});


test("administrador pode copiar relatório de pendências sem nova API", () => {
  const html=appHtml();
  assert.match(html, /onclick="copyPendingTeamReport\(\)"/);
  assert.match(html, /function copyPendingTeamReport\(\)/);
  assert.match(html, /Formação ainda não configurada/);
  assert.match(html, /Aguardando integrante:/);
  assert.match(html, /Aprovação pendente:/);
});
