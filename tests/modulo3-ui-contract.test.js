import test from 'node:test';
import assert from 'node:assert/strict';
import { Script } from 'node:vm';
import { appHtml } from '../src/web/app.js';

const html = appHtml();

test('Módulo 3: estrutura de navegação e consulta existe no HTML', () => {
  for (const id of ['attendanceView','reportsView','reportStart','reportEnd','reportResult']) {
    assert.match(html,new RegExp('id="'+id+'"'));
  }
  assert.match(html,/data-view="attendance"/);
  assert.match(html,/onclick="loadParticipation\(\)"/);
});

test('Módulo 3: interface conecta ações aos endpoints corretos', () => {
  for (const path of ['/api/admin/attendance/event','/api/admin/attendance','/api/admin/attendance/close','/api/reports/participation']) {
    assert.ok(html.includes(path),path);
  }
  for (const fn of ['renderAttendance','loadAttendanceEvent','saveAttendanceMember','closeAttendanceEvent','loadParticipation']) {
    assert.ok(html.includes('function '+fn+'('),fn);
  }
});

test('Módulo 3: campos e bloqueios de fluxo são oferecidos', () => {
  for (const status of ['present','absent_justified','absent_unjustified']) assert.ok(html.includes(status),status);
  assert.match(html,/Motivo do registro ou correção/);
  assert.match(html,/Justificativa da ausência/);
  assert.match(html,/Confirmar fechamento das presenças deste evento/);
  assert.match(html,/if\(!closed\)/);
  assert.match(html,/canAccessAttendance\(\)/);
});

test('Módulo 3: indicadores e ajuste responsivo constam no HTML', () => {
  for (const label of ['Compromissos:','Funções:','Presenças:','Pendentes:','Ausências justificadas:','Ausências não justificadas:','Taxa de presença:']) {
    assert.ok(html.includes(label),label);
  }
  assert.match(html,/@media\(max-width:700px\)/);
  assert.match(html,/name="viewport"/);
});

test('Módulo 3: scripts embutidos no HTML possuem JavaScript válido', () => {
  const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
  assert.ok(scripts.length>0,'Nenhum script embutido encontrado');
  for(const [,source] of scripts) {
    assert.doesNotThrow(()=>new Script(source), 'JavaScript embutido inválido');
  }
});
