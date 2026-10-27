export function appHtml() {
return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Ministério de Louvor</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;background:#f5f6f8;color:#20242a}
header{background:#111827;color:white;padding:16px}.wrap{max-width:1000px;margin:auto;padding:16px}
.card{background:white;border:1px solid #e5e7eb;border-radius:16px;padding:18px;margin:12px 0;box-shadow:0 2px 10px rgba(0,0,0,.03)}
.row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.grid{display:grid;gap:12px}.g2{grid-template-columns:1fr 1fr}
button{border:0;border-radius:10px;padding:10px 14px;background:#111827;color:white;cursor:pointer}button.alt{background:#e5e7eb;color:#111827}button.danger{background:#991b1b}
input,select{width:100%;padding:10px;border:1px solid #d1d5db;border-radius:10px;margin-top:5px}label{font-weight:700;font-size:14px}
.muted{color:#6b7280;font-size:14px}.title{font-weight:800;font-size:18px}.hidden{display:none}.ok{color:#166534}.err{color:#991b1b}
.tag{padding:4px 8px;background:#eef2ff;border-radius:999px;font-size:12px}.avail{margin-top:8px;padding:8px;background:#f9fafb;border-radius:8px}
.smallbtn{padding:6px 9px;font-size:12px}.checkbox{width:auto}.tabs{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
@media(max-width:700px){.g2{grid-template-columns:1fr}.wrap{padding:12px}}

:root{--ink:#243247;--sub:#64748b;--accent:#2563eb;--line:#e2e8f0}
body{background:#f5f7fb;color:var(--ink);line-height:1.5}
header{background:#fff;color:var(--ink);border-bottom:1px solid var(--line);padding:0;box-shadow:0 2px 12px #0f172a09}
.wrap{max-width:1180px;padding:20px 24px}header .wrap{min-height:72px}
.brand{display:flex;align-items:center;gap:12px;font-size:17px}.brand-icon{display:grid;place-items:center;background:#e8efff;width:42px;height:42px;border-radius:13px;font-size:22px}
#topUser{font-size:13px;color:var(--sub)}
.card{border:1px solid var(--line);border-radius:16px;padding:20px 22px;box-shadow:0 4px 18px #1f293709;margin:14px 0}
h1,h2{letter-spacing:-.03em;line-height:1.25}h1{font-size:clamp(22px,3vw,29px)}h2{font-size:19px;margin-top:0}
.title{font-size:17px}.muted{color:var(--sub)}
button{background:var(--accent);font-weight:650;min-height:40px;transition:background .15s}
button:hover{background:#1d4ed8}button.alt{background:#edf2f8;color:#334155}button.alt:hover{background:#dce7f5}
button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #93c5fd;outline-offset:2px}
input,select{width:100%;max-width:100%;min-height:40px;padding:9px 11px;background:white;border-color:#cbd5e1;font:inherit;font-size:14px}
input[type=checkbox]{width:17px;height:17px;min-height:17px;margin:0;accent-color:var(--accent)}
label{font-size:13px;color:#334155;display:block}.g2{grid-template-columns:repeat(2,minmax(0,1fr))}
.form-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:13px 16px}
.form-grid>*{grid-column:span 6;min-width:0}.form-grid .span-2{grid-column:span 2}.form-grid .span-3{grid-column:span 3}.form-grid .span-4{grid-column:span 4}.form-grid .span-6{grid-column:span 6}.form-grid .span-8{grid-column:span 8}
.tabs{gap:6px;padding:6px;background:#eaf0f8;border-radius:14px;margin:16px 0 20px;width:fit-content;max-width:100%}
.tabs button{background:transparent;color:#526176;border-radius:10px;padding:10px 15px}
.tabs button:hover{background:#dce7f5;color:#1e40af}.tabs button.active{background:#fff;color:#1d4ed8;box-shadow:0 2px 7px #0f172a16}
.hero{background:linear-gradient(110deg,#fff 20%,#edf4ff);border-color:#dce7f8}.hero .tag{background:#e0ecff;color:#1d4ed8;font-weight:700}
.schedule-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-items:stretch}
.schedule-grid>.card{margin:0;min-width:0}
.event-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
.event-title{font-weight:650;margin-top:3px}.event-meta{margin-top:5px}
.availability-toggle{display:inline-flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #dbe5f2;border-radius:10px;background:#f7faff;white-space:nowrap;font-size:12px;cursor:pointer}
.event-controls{display:grid;gap:10px;margin-top:13px}
.avail{background:#f7f9fd;border:1px solid #e8eef6;padding:10px 12px;border-radius:10px;overflow-wrap:anywhere}
.requirement-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(185px,1fr));gap:9px}
.requirement-item{display:inline-flex;align-items:center;gap:8px;margin:4px 6px 4px 0;font-weight:500}
.requirement-item input{width:66px;min-height:34px;padding:5px 7px;margin:0;text-align:center}
.smallbtn{font-size:12px;padding:7px 10px;min-height:34px}
#usersView .card.row{align-items:flex-start}#usersView .card.row>div:first-child{flex:1;min-width:200px}
#usersView .avail label{display:inline-flex;align-items:center;gap:5px;margin:4px 9px 4px 0;font-weight:500}
@media(max-width:900px){.schedule-grid{grid-template-columns:1fr}.wrap{padding:16px}}
@media(max-width:700px){.g2{grid-template-columns:1fr}.wrap{padding:12px}.card{padding:16px}.form-grid>*{grid-column:span 12!important}.tabs{width:100%}.tabs button{flex:1;padding:9px 7px;font-size:13px}.event-head{flex-wrap:wrap}.availability-toggle{width:100%;justify-content:center}.brand{font-size:15px}header .wrap{min-height:62px}}
@media(prefers-reduced-motion:reduce){button{transition:none}}
</style>
</head>
<body>
<header><div class="wrap row"><div class="brand"><span class="brand-icon" aria-hidden="true">🎶</span><strong>Ministério de Louvor</strong></div><div id="topUser"></div></div></header>
<main class="wrap">
<section id="loading" class="card">Carregando...</section>

<section id="bootstrap" class="card hidden">
<h1>👑 Primeiro acesso</h1>
<p class="muted">Crie a conta do administrador inicial. Esta tela desaparece depois da primeira conta.</p>
<div class="grid g2">
<div><label>Nome<input id="bName" placeholder="Pr Anderson"></label></div>
<div><label>E-mail<input id="bEmail" type="email"></label></div>
<div><label>Senha<input id="bPass" type="password" minlength="8"></label></div>
</div><br>
<button onclick="bootstrap()">Criar administrador</button>
<p id="bMsg"></p>
</section>

<section id="login" class="card hidden" style="max-width:520px;margin:30px auto">
<h1>🔐 Entrar</h1>
<p class="muted">Use seu e-mail e sua senha individual.</p>
<label>E-mail<input id="email" type="email" autocomplete="email"></label><br><br>
<label>Senha<input id="pass" type="password" autocomplete="current-password"></label><br><br>
<button onclick="login()">Entrar</button>
<p id="loginMsg"></p>
</section>

<section id="app" class="hidden">
<div class="card row hero"><div><h1 id="month" style="margin:0"></h1><div id="welcome" class="muted"></div></div><div class="row"><span id="roleTag" class="tag"></span><button class="alt" onclick="logout()">Sair</button></div></div>
<nav id="adminTabs" class="tabs hidden" aria-label="Seções do sistema">
<button data-view="schedule" aria-controls="scheduleView" onclick="showView('schedule')">📅 Escala</button>
<button data-view="users" aria-controls="usersView" onclick="showView('users')">👥 Integrantes</button>
<button data-view="settings" aria-controls="settingsView" onclick="showView('settings')">⚙️ Configurações</button>
</nav>
<div id="scheduleView"></div>
<div id="usersView" class="hidden"></div>
<div id="settingsView" class="hidden"></div>
</section>
</main>

<script>
let ME=null, DATA=null;

async function api(path, options={}){
  const r=await fetch(path,{headers:{'content-type':'application/json',...(options.headers||{})},...options});
  const text=await r.text(); let data={}; try{data=text?JSON.parse(text):{}}catch{}
  if(!r.ok) throw new Error(data.error||'Erro na operação.');
  return data;
}

async function init(){
  try{
    const status=await api('/api/bootstrap-status');
    if(status.needsBootstrap){ hide('loading'); show('bootstrap'); return; }
    try{
      const me=await api('/api/me'); ME=me.user; await loadApp();
    }catch{ hide('loading'); show('login'); }
  }catch(e){ document.getElementById('loading').innerText=e.message; }
}

async function bootstrap(){
  const msg=id('bMsg'); msg.textContent='Criando...'; msg.className='';
  try{
    await api('/api/bootstrap',{method:'POST',body:JSON.stringify({name:val('bName'),email:val('bEmail'),password:val('bPass')})});
    ME=(await api('/api/me')).user; hide('bootstrap'); await loadApp();
  }catch(e){msg.textContent=e.message;msg.className='err'}
}

async function login(){
  const msg=id('loginMsg'); msg.textContent='Entrando...'; msg.className='';
  try{
    await api('/api/login',{method:'POST',body:JSON.stringify({email:val('email'),password:val('pass')})});
    ME=(await api('/api/me')).user; hide('login'); await loadApp();
  }catch(e){msg.textContent=e.message;msg.className='err'}
}

async function logout(){
  await fetch('/api/logout',{method:'POST'}); location.reload();
}

async function loadApp(){
  DATA=await api('/api/data'); hide('loading'); hide('login'); show('app');
  id('month').textContent=DATA.settings.month_label;
  id('welcome').textContent='Olá, '+ME.name+'.';
  id('roleTag').textContent=ME.role==='admin'?'Administrador':'Integrante';
  id('topUser').textContent=ME.name;
  if(ME.role==='admin') show('adminTabs');
  renderSchedule();
  if(ME.role==='admin'){renderUsers();renderSettings();showView('schedule');}
}

function renderSchedule(){
  const own=new Set(DATA.ownAvailability.filter(x=>x.available).map(x=>Number(x.event_id)));
  let html='<div class="schedule-grid">';
  for(const e of DATA.events){
    const available=(DATA.allAvailability||[]).filter(a=>Number(a.event_id)===Number(e.id));
    html+=\`<article class="card event-card">
      <div class="event-head">
       <div><div class="title">\${esc(e.icon)} \${e.event_date.slice(8,10)} – \${esc(e.day_code)} –</div>
       \${e.title?'<div><strong>'+esc(e.title)+'</strong></div>':''}
       <div class="muted">\${e.assigned_name?'✅ Escalado: '+esc(e.assigned_name):'⚪ Sem responsável definido'}</div></div>
       <label class="availability-toggle"><input class="checkbox" type="checkbox" \${own.has(Number(e.id))?'checked':''} \${(!DATA.settings.availability_open&&ME.role!=='admin')?'disabled':''}
       onchange="setAvailability(\${e.id},this.checked)"> Estou disponível</label>
      </div>\`;
    if(ME.role==='admin'){
      html+=\`<div class="avail"><strong>Disponíveis:</strong> \${available.length?available.map(a=>esc(a.name)).join(', '):'ninguém marcou'}</div>
      <div class="event-controls"><label>Responsável oficial
       <select onchange="assign(\${e.id},this.value)">
        <option value="">— Não definido —</option>
        \${DATA.members.filter(m=>m.active).map(m=>\`<option value="\${m.id}" \${Number(e.assigned_user_id)===Number(m.id)?'selected':''}>\${esc(m.name)}</option>\`).join('')}
       </select></label></div>\`;
    }
    html+='</article>';
  }
  html+='</div>';
  if(ME.role==='admin'){
    html+='<div class="card"><h2>Montagem de equipes</h2><p class="muted">As sugestões são preliminares. O administrador precisa aprovar a reserva e cada integrante deve confirmar.</p><button class="smallbtn" onclick="printTeamSchedule()">Imprimir equipes / salvar em PDF</button>';
    for(const e of DATA.events){
      const team=(DATA.teamAssignments||[]).filter(x=>Number(x.event_id)===Number(e.id));
      html+=\`<div class="avail"><strong>\${esc(e.event_date)}</strong> — \${team.filter(x=>x.status!=='declined').length} integrante(s) em escalação <button class="smallbtn" onclick="previewTeam(\${e.id})">Sugerir equipe</button><div id="preview\${e.id}"></div></div>\`;


    html+=\`<div class="avail">\${team.map(x=>{
      const member=(DATA.members||[]).find(m=>Number(m.id)===Number(x.user_id));
      const role=(DATA.roles||[]).find(r=>Number(r.id)===Number(x.role_id));
      return '<div class="row"><span>'+esc(member?.name||'Integrante')+' — '+esc(role?.label||'Função')+' ('+esc(x.status)+')</span>'+
        (x.status==='proposed'?'<button class="smallbtn" onclick="approveTeam('+Number(e.id)+','+Number(x.user_id)+','+Number(x.role_id)+','+Boolean(x.is_leader)+')">Aprovar reserva</button>':'')+
        (x.status!=='declined'?'<button class="smallbtn alt" onclick="cancelTeam('+Number(e.id)+','+Number(x.user_id)+','+Number(x.role_id)+')">Retirar da equipe</button>':'')+'</div>';
    }).join('')}</div>\`;
    }
    html+='<div class="avail"><strong>Formação desejada por evento</strong></div>';
    for(const e of DATA.events){
      html+='<div class="avail">'+esc(e.event_date)+': '+(DATA.roles||[]).filter(r=>r.active).map(r=>{
        const req=(DATA.requirements||[]).find(x=>Number(x.event_id)===Number(e.id)&&Number(x.role_id)===Number(r.id));
        return '<label style="display:inline-block;margin:5px">'+esc(r.label)+' <input type="number" min="0" max="50" style="width:65px" value="'+Number(req?.slots||0)+'" onchange="updateRequirement('+Number(e.id)+','+Number(r.id)+',this.value)"></label>';
      }).join('')+'</div>';
    }
    html+='</div>';
  } else {
    const team=DATA.teamAssignments||[];
    if(team.length){
      html+='<div class="card"><h2>Minhas escalações</h2>';
      for(const x of team){
        const event=DATA.events.find(e=>Number(e.id)===Number(x.event_id));
        const role=(DATA.roles||[]).find(r=>Number(r.id)===Number(x.role_id));
        html+=\`<div class="avail">\${esc(event?.event_date||'Evento')} — \${esc(role?.label||'Função')} — \${esc(x.status)} \${x.status==='reserved'?\`<button class="smallbtn" onclick="confirmTeam(\${x.event_id},\${x.role_id},true)">Confirmar</button> <button class="smallbtn alt" onclick="confirmTeam(\${x.event_id},\${x.role_id},false)">Recusar</button>\`:x.status==='confirmed'?\`<button class="smallbtn alt" onclick="confirmTeam(\${x.event_id},\${x.role_id},false)">Solicitar saída</button>\`:''}</div>\`;
      }
      html+='</div>';
    }
  }
  id('scheduleView').innerHTML=html;
}

function printTeamSchedule(){
  const confirmed=(DATA.teamAssignments||[]).filter(x=>x.status==='confirmed');
  if(!confirmed.length){alert('Não há integrantes confirmados para impressão.');return;}
  const sections=DATA.events.map(e=>{
    const members=confirmed.filter(x=>Number(x.event_id)===Number(e.id));
    if(!members.length)return '';
    const rows=members.map(x=>{
      const person=(DATA.members||[]).find(m=>Number(m.id)===Number(x.user_id));
      const role=(DATA.roles||[]).find(r=>Number(r.id)===Number(x.role_id));
      return '<tr><td>'+esc(person?.name||'Integrante')+'</td><td>'+esc(role?.label||'Função')+'</td></tr>';
    }).join('');
    return '<section><h2>'+esc(e.event_date)+' — '+esc(e.title||e.day_code||'Culto')+'</h2><table><thead><tr><th>Integrante</th><th>Função</th></tr></thead><tbody>'+rows+'</tbody></table></section>';
  }).join('');
  const popup=window.open('','_blank');
  if(!popup){alert('Permita a abertura da janela de impressão no navegador.');return;}
  popup.document.open();
  popup.document.write('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Escalas confirmadas</title><style>body{font:16px Arial,sans-serif;margin:32px;color:#222}h1{margin-bottom:28px}section{break-inside:avoid;margin-bottom:28px}h2{font-size:18px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbb;padding:9px;text-align:left}th{background:#eee}@media print{body{margin:12mm}}</style></head><body><h1>Ministério de Louvor — Escalas confirmadas</h1>'+sections+'</body></html>');
  popup.document.close();
  popup.focus();
  popup.print();
}

async function updateRequirement(eventId,roleId,value){
  const slots=Number(value);
  if(!Number.isSafeInteger(slots)||slots<0||slots>50){alert('Quantidade inválida.');return;}
  try{await api('/api/admin/event-requirement',{method:'POST',body:JSON.stringify({eventId,roleId,slots})});await reloadData()}
  catch(e){alert(e.message);await reloadData()}
}
async function previewTeam(eventId){
  const target=id('preview'+eventId);
  target.textContent='Buscando sugestões...';
  try{
    const result=await api('/api/admin/team-suggestions?eventId='+encodeURIComponent(eventId));
    if(!result.suggestions.length){target.textContent='Nenhum integrante elegível disponível.';return;}
    target.innerHTML=result.suggestions.map(x=>{
      const member=DATA.members.find(m=>Number(m.id)===Number(x.userId));
      const role=DATA.roles.find(r=>Number(r.id)===Number(x.roleId));
      return \`<div class="row"><span>\${esc(member?.name||'Integrante')} — \${esc(role?.label||'Função')}</span><button class="smallbtn" onclick="saveSuggestion(\${eventId},\${x.userId},\${x.roleId},\${x.isLeader})">Propor</button></div>\`;
    }).join('');
  }catch(e){target.textContent=e.message}
}
async function cancelTeam(eventId,userId,roleId){
  if(!confirm('Retirar este integrante da equipe? A vaga ficará disponível para substituição.')) return;
  try{await api('/api/admin/team-cancel',{method:'POST',body:JSON.stringify({eventId,userId,roleId})});await reloadData()}
  catch(e){alert(e.message)}
}
async function approveTeam(eventId,userId,roleId,isLeader){
  try{await api('/api/admin/team-assignment',{method:'POST',body:JSON.stringify({eventId,userId,roleId,isLeader,status:'reserved'})});await reloadData()}
  catch(e){alert(e.message)}
}
async function saveSuggestion(eventId,userId,roleId,isLeader){
  try{await api('/api/admin/team-assignment',{method:'POST',body:JSON.stringify({eventId,userId,roleId,isLeader,status:'proposed'})});await reloadData()}
  catch(e){alert(e.message)}
}
async function confirmTeam(eventId,roleId,confirm){
  try{await api('/api/team-confirmation',{method:'POST',body:JSON.stringify({eventId,roleId,confirm})});await reloadData()}
  catch(e){alert(e.message)}
}
async function setAvailability(eventId, available){
  try{ await api('/api/availability',{method:'POST',body:JSON.stringify({eventId,available})}); await reloadData(); }
  catch(e){alert(e.message);await reloadData();}
}

async function assign(eventId,userId){
  try{await api('/api/admin/assign',{method:'POST',body:JSON.stringify({eventId,userId:userId||null})});await reloadData()}
  catch(e){alert(e.message)}
}

function renderUsers(){
  id('usersView').innerHTML=\`
  <div class="card"><h2>👥 Cadastrar integrante</h2>
  <div class="form-grid">
   <label class="span-4">Nome<input id="uName"></label><label class="span-8">E-mail<input id="uEmail" type="email"></label>
   <label class="span-6">Senha inicial<input id="uPass" type="password" minlength="8"></label>
   <label class="span-6">Perfil<select id="uRole"><option value="member">Integrante</option><option value="admin">Administrador</option></select></label>
  </div><br><button onclick="createUser()">Cadastrar</button><p id="uMsg"></p></div>
  \${DATA.members.map(u=>\`<div class="card row"><div><strong>\${esc(u.name)}</strong><div class="muted">\${esc(u.email)} · \${u.role==='admin'?'Administrador':'Integrante'} · \${u.active?'Ativo':'Desativado'}</div><div class="avail"><strong>Funções:</strong> \${(DATA.roles||[]).filter(r=>r.active).map(r=>\`<label style="font-weight:400;margin:6px"><input class="checkbox" type="checkbox" \${(DATA.memberRoles||[]).some(m=>Number(m.user_id)===Number(u.id)&&Number(m.role_id)===Number(r.id))?'checked':''} onchange="updateMemberRole(\${u.id},\${r.id},this.checked)"> \${esc(r.label)}</label>\`).join('')}</div></div><div class="row">
  <button class="smallbtn alt" onclick="resetPass(\${u.id})">Alterar senha</button>
  <button class="smallbtn \${u.active?'danger':'alt'}" onclick="toggleUser(\${u.id},\${u.active?0:1})">\${u.active?'Desativar':'Ativar'}</button>
  </div></div>\`).join('')}\`;
}

async function updateMemberRole(userId,roleId,enabled){
  try{await api('/api/admin/member-role',{method:'POST',body:JSON.stringify({userId,roleId,enabled})});await reloadData()}
  catch(e){alert(e.message);await reloadData()}
}
async function createUser(){
  const msg=id('uMsg');msg.textContent='';
  try{
    await api('/api/admin/users',{method:'POST',body:JSON.stringify({name:val('uName'),email:val('uEmail'),password:val('uPass'),role:val('uRole')})});
    msg.textContent='Integrante cadastrado.';msg.className='ok';await reloadData();
  }catch(e){msg.textContent=e.message;msg.className='err'}
}
async function toggleUser(userId,active){
  try{await api('/api/admin/user-state',{method:'POST',body:JSON.stringify({userId,active:!!active})});await reloadData()}
  catch(e){alert(e.message)}
}
async function resetPass(userId){
  const p=prompt('Digite a nova senha (mínimo 8 caracteres):'); if(!p)return;
  try{await api('/api/admin/password',{method:'POST',body:JSON.stringify({userId,password:p})});alert('Senha alterada. O usuário precisará entrar novamente.')}
  catch(e){alert(e.message)}
}

function renderSettings(){
  id('settingsView').innerHTML=\`
  <div class="card"><h2>⚙️ Disponibilidade</h2>
  <p>Estado atual: <strong>\${DATA.settings.availability_open?'ABERTA':'FECHADA'}</strong></p>
  <button onclick="toggleWindow(\${DATA.settings.availability_open?0:1})">\${DATA.settings.availability_open?'Fechar período':'Reabrir período'}</button>
  </div>
  <div class="card"><h2>➕ Novo evento</h2>
  <div class="form-grid"><label class="span-3">Data<input id="eDate" type="date"></label><label class="span-3">Código do dia<input id="eDay" placeholder="Q, S, D, Sx"></label><label class="span-4">Título<input id="eTitle"></label><label class="span-2">Emoji<input id="eIcon" value="🎶"></label></div><br>
  <button onclick="createScheduleEvent()">Adicionar evento</button><p id="eMsg"></p></div>\`;
}
async function toggleWindow(open){
  await api('/api/admin/settings',{method:'POST',body:JSON.stringify({availabilityOpen:!!open})});await reloadData();
}
async function createScheduleEvent(){
  const msg=id('eMsg');msg.textContent='';
  try{
    await api('/api/admin/event',{method:'POST',body:JSON.stringify({eventDate:val('eDate'),dayCode:val('eDay'),title:val('eTitle'),icon:val('eIcon')})});
    msg.textContent='Evento adicionado.';msg.className='ok';await reloadData();
  }catch(e){msg.textContent=e.message;msg.className='err'}
}

async function reloadData(){DATA=await api('/api/data');renderSchedule();if(ME.role==='admin'){renderUsers();renderSettings();}}
function showView(v){for(const x of ['schedule','users','settings']) id(x+'View').classList.toggle('hidden',x!==v);document.querySelectorAll('#adminTabs [data-view]').forEach(b=>{const selected=b.dataset.view===v;b.classList.toggle('active',selected);b.setAttribute('aria-current',selected?'page':'false')})}
function id(x){return document.getElementById(x)} function val(x){return id(x).value}
function show(x){id(x).classList.remove('hidden')} function hide(x){id(x).classList.add('hidden')}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
init();
</script>
</body></html>`;
}
