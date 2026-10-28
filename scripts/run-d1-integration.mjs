import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root=await mkdtemp(join(tmpdir(),'vertical-d1-integration-'));
const wrangler=process.platform==='win32'?'npx.cmd':'npx';
const run=(args)=>{
 const r=spawnSync(wrangler,['wrangler',...args],{encoding:'utf8',stdio:'inherit',shell:process.platform==='win32',timeout:120000});
 if(r.error||r.status!==0)throw new Error('Wrangler falhou: '+args.join(' '));
};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let server;
function stopServer(child){
 if(!child || !child.pid)return;
 try { if(process.platform==='win32')child.kill('SIGTERM'); else process.kill(-child.pid,'SIGTERM'); } catch { try { child.kill('SIGTERM'); } catch {} }
}

async function phase(id,port){
 const config='scripts/'+id+'.wrangler.jsonc';
 server=spawn(wrangler,['wrangler','dev','--config',config,'--local','--ip','127.0.0.1','--port',String(port),'--persist-to',root],{stdio:'pipe',shell:process.platform==='win32',detached:process.platform!=='win32'});
 let output='';
 server.stdout.on('data',d=>{output+=d.toString();});
 server.stderr.on('data',d=>{output+=d.toString();});
 try{
  let ready=false;
  for(let i=0;i<80;i++){
   if(server.exitCode!==null)throw new Error(id+' encerrou antes de iniciar: '+output.slice(-2000));
   try{const r=await fetch('http://127.0.0.1:'+port+'/__health',{signal:AbortSignal.timeout(500)});if(r.status===404){ready=true;break;}}catch{}
   await sleep(500);
  }
  if(!ready)throw new Error(id+' não iniciou: '+output.slice(-2000));
  const response=await fetch('http://127.0.0.1:'+port+'/'+id,{method:'POST',signal:AbortSignal.timeout(30000)});
  const body=await response.json();
  console.log(id,JSON.stringify(body));
  if(!response.ok||body.ok!==true||Object.values(body.checks||{}).some(x=>x!==true))throw new Error(id+' não aprovado');
 }finally{
  stopServer(server);
  await sleep(500);
  server=null;
 }
}
try{
 console.log('Banco temporário:',root);
 run(['d1','migrations','apply','louvor-db','--local','--persist-to',root]);
 run(['d1','execute','louvor-db','--local','--persist-to',root,'--file','scripts/id01-fixture-local.sql']);
 for(const [id,port] of [['id01',8791],['id02',8792],['id03',8793],['id04',8794],['id05',8795],['http-security',8796]])await phase(id,port);
 console.log('APROVADO: ID01 a ID05 e HTTP security, D1 temporário.');
}catch(e){console.error('FALHA:',e.message);process.exitCode=1;
}finally{if(server)stopServer(server);await rm(root,{recursive:true,force:true,maxRetries:5,retryDelay:1000});}
