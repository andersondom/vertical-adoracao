import test from 'node:test';
import assert from 'node:assert/strict';
import { appHtml } from '../src/web/app.js';

const html=appHtml();
test('aba de presenças é habilitada para liderança por evento',()=>{
 assert.match(html,/function leaderEventIds\(\)/);
 assert.match(html,/function canAccessAttendance\(\)/);
 assert.match(html,/updateAttendanceNavigation\(\)/);
 assert.match(html,/renderAttendance\(\)/);
});

test('lista de eventos de presenças filtra líder pelos seus eventos',()=>{
 assert.match(html,/filter\(e=>ME\.role==='admin'\|\|leaderEventIds\(\)\.has\(Number\(e\.id\)\)\)/);
});

test('abas administrativas permanecem indisponíveis a integrantes',()=>{
 assert.match(html,/if\(\(v==='users'\|\|v==='settings'\)&&ME\.role!=='admin'\)return/);
 assert.match(html,/button\.classList\.toggle\('hidden',ME\.role!=='admin'\)/);
});
