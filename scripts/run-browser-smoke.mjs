import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';

const root=await mkdtemp(join(tmpdir(),'vertical-browser-'));
const command=process.platform==='win32'?'npx.cmd':'npx';
const run=args=>{const p=spawnSync(command,['wrangler',...args],{encoding:'utf8',timeout:120000,shell:process.platform==='win32'});if(p.status!==0)throw Error('Wrangler: '+args.join(' ')+' '+p.stderr.slice(-1000));};
const port=8789;
let server,browser;
try {
 run(['d1','migrations','apply','louvor-db','--local','--persist-to',root]);
 run(['d1','execute','louvor-db','--local','--persist-to',root,'--file','scripts/seed-local.sql']);
 run(['d1','execute','louvor-db','--local','--persist-to',root,'--command',"INSERT INTO team_assignments(event_id,user_id,role_id,status,is_leader) SELECT e.id,u.id,r.id,'confirmed',0 FROM events e JOIN users u ON u.email='integrante.test@exemplo.invalid' JOIN ministry_roles r ON r.id=(SELECT MIN(id) FROM ministry_roles) WHERE e.event_date='2027-01-10'"]);
 run(['d1','execute','louvor-db','--local','--persist-to',root,'--command',"INSERT INTO sessions(id,user_id,expires_at) SELECT 'browser-admin',id,'2099-01-01T00:00:00.000Z' FROM users WHERE email='admin.test@exemplo.invalid'"]);
 server=spawn(command,['wrangler','dev','--local','--ip','127.0.0.1','--port',String(port),'--persist-to',root],{stdio:'pipe',detached:process.platform!=='win32',shell:process.platform==='win32'});
 let output='';server.stdout.on('data',x=>output+=x);server.stderr.on('data',x=>output+=x);
 let ready=false;
 for(let i=0;i<80;i++){if(server.exitCode!==null)throw Error('Servidor encerrou: '+output.slice(-1000));try{const r=await fetch('http://127.0.0.1:'+port+'/login');if(r.status===200){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}
 if(!ready)throw Error('Servidor não iniciou: '+output.slice(-1000));
 browser=await chromium.launch({headless:true});
 for(const viewport of [{width:1366,height:768},{width:390,height:844}]){
  const context=await browser.newContext({viewport});
  await context.addCookies([{name:'louvor_session',value:'browser-admin',url:'http://127.0.0.1:'+port}]);
  const page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'networkidle'});
  await page.locator('#app').waitFor({state:'visible'});
  await page.locator('[data-view="attendance"]').click();
  await page.locator('#attendanceView').waitFor({state:'visible'});
  await page.locator('#attendanceEvent').selectOption({index:1});
  await page.getByRole('button',{name:'Abrir evento'}).click();
  await page.locator('#attendanceDetail').getByText('Teste Integrante').waitFor({state:'visible'});
  const member=page.locator('#attendanceDetail .avail').filter({hasText:'Teste Integrante'});
  await member.locator('select').selectOption('present');
  await member.locator('input[placeholder="Obrigatório"]').fill('Teste automatizado de presença');
  await member.getByRole('button',{name:'Salvar'}).click();
  await page.locator('#attendanceDetail').getByText('Teste Integrante').waitFor({state:'visible'});
  await page.waitForFunction(()=>document.querySelector('#attendanceDetail select[id^="attStatus"]')?.value==='present');
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Encerrar presenças do evento'}).click();
  await page.getByText('Fechamento:').waitFor();
  await page.waitForFunction(()=>document.querySelector('#attendanceDetail')?.textContent.includes('Encerrado'));
  const memberAfter=page.locator('#attendanceDetail .avail').filter({hasText:'Teste Integrante'});
  await memberAfter.locator('select').selectOption('absent_justified');
  await memberAfter.locator('input[id^="attNote"]').fill('Ausência de teste');
  await memberAfter.locator('input[placeholder="Obrigatório"]').fill('Correção de teste automatizada');
  await memberAfter.getByRole('button',{name:'Salvar'}).click();
  await page.waitForFunction(()=>document.querySelector('#attendanceDetail select[id^="attStatus"]')?.value==='absent_justified');
  await page.locator('#reportStart').waitFor({state:'visible'});
  if(errors.length)throw Error('Erros JavaScript: '+errors.join('; '));
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
  if(overflow)throw Error('Rolagem horizontal inesperada em '+viewport.width);
  console.log('BROWSER_OK',JSON.stringify({viewport,attendance:true,closure:true,correction:true,reports:true,jsErrors:0,overflow:false}));
  await context.close();
 }
}finally{
 if(browser)await browser.close();
 if(server?.pid){try{if(process.platform==='win32')server.kill();else process.kill(-server.pid,'SIGTERM')}catch{}}
 await rm(root,{recursive:true,force:true,maxRetries:5,retryDelay:1000});
}
