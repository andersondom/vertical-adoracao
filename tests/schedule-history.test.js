import test from 'node:test';
import assert from 'node:assert/strict';
import { appHtml } from '../src/web/app.js';
import { getData } from '../src/db/schedule.js';
test('interface possui seletor de mês e navegação para mês atual',()=>{
 const html=appHtml();
 assert.match(html,/id="scheduleMonth" type="month"/);
 assert.match(html,/function changeScheduleMonth\(month\)/);
 assert.match(html,/\/api\/data\?month=/);
});
test('consulta histórica não gera eventos automaticamente',async()=>{
 const sql=[];
 const db={prepare(q){sql.push(q);return {bind(){return this},async first(){return {month_label:'',availability_open:1}},async all(){return {results:[]}},async run(){return {}}}}};
 await getData({DB:db},{id:1,role:'admin'},'2024-01');
 assert.equal(sql.some(q=>q.includes('INSERT OR IGNORE INTO events')),false);
 assert.equal(sql.some(q=>q.includes('FROM events e')),true);
});
