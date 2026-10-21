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
</style>
</head>
<body>
<header><div class="wrap row"><strong>🎶 Ministério de Louvor</strong><div id="topUser"></div></div></header>
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
<div class="card row"><div><h1 id="month" style="margin:0"></h1><div id="welcome" class="muted"></div></div><div class="row"><span id="roleTag" class="tag"></span><button class="alt" onclick="logout()">Sair</button></div></div>
<div id="adminTabs" class="tabs hidden">
<button onclick="showView('schedule')">📅 Escala</button>
<button onclick="showView('users')">👥 Integrantes</button>
<button onclick="showView('settings')">⚙️ Configurações</button>
</div>
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
  if(ME.role==='admin'){renderUsers();renderSettings();}
}

function renderSchedule(){
  const own=new Set(DATA.ownAvailability.filter(x=>x.available).map(x=>Number(x.event_id)));
  let html='';
  for(const e of DATA.events){
    const available=(DATA.allAvailability||[]).filter(a=>Number(a.event_id)===Number(e.id));
    html+=\`<article class="card">
      <div class="row">
       <div><div class="title">\${esc(e.icon)} \${e.event_date.slice(8,10)} – \${esc(e.day_code)} –</div>
       \${e.title?'<div><strong>'+esc(e.title)+'</strong></div>':''}
       <div class="muted">\${e.assigned_name?'✅ Escalado: '+esc(e.assigned_name):'⚪ Sem responsável definido'}</div></div>
       <label style="font-weight:500"><input class="checkbox" type="checkbox" \${own.has(Number(e.id))?'checked':''} \${(!DATA.settings.availability_open&&ME.role!=='admin')?'disabled':''}
       onchange="setAvailability(\${e.id},this.checked)"> Estou disponível</label>
      </div>\`;
    if(ME.role==='admin'){
      html+=\`<div class="avail"><strong>Disponíveis:</strong> \${available.length?available.map(a=>esc(a.name)).join(', '):'ninguém marcou'}</div>
      <div style="margin-top:10px"><label>Responsável oficial
       <select onchange="assign(\${e.id},this.value)">
        <option value="">— Não definido —</option>
        \${DATA.members.filter(m=>m.active).map(m=>\`<option value="\${m.id}" \${Number(e.assigned_user_id)===Number(m.id)?'selected':''}>\${esc(m.name)}</option>\`).join('')}
       </select></label></div>\`;
    }
    html+='</article>';
  }
  if(ME.role==='admin'){
    html+='<div class="card"><h2>Montagem de equipes</h2>';
    for(const e of DATA.events){
      const team=(DATA.teamAssignments||[]).filter(x=>Number(x.event_id)===Number(e.id));
      html+=\`<div class="avail"><strong>\${esc(e.event_date)}</strong> — \${team.length} integrante(s) escalado(s) <button class="smallbtn" onclick="previewTeam(\${e.id})">Sugerir equipe</button><div id="preview\${e.id}"></div></div>\`;
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
        html+=\`<div class="avail">\${esc(event?.event_date||'Evento')} — \${esc(role?.label||'Função')} — \${esc(x.status)} \${x.status!=='declined'?\`<button class="smallbtn" onclick="confirmTeam(\${x.event_id},\${x.role_id},true)">Confirmar</button> <button class="smallbtn alt" onclick="confirmTeam(\${x.event_id},\${x.role_id},false)">Recusar</button>\`:''}</div>\`;
      }
      html+='</div>';
    }
  }
  id('scheduleView').innerHTML=html;
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
  <div class="grid g2">
   <label>Nome<input id="uName"></label><label>E-mail<input id="uEmail" type="email"></label>
   <label>Senha inicial<input id="uPass" type="password" minlength="8"></label>
   <label>Perfil<select id="uRole"><option value="member">Integrante</option><option value="admin">Administrador</option></select></label>
  </div><br><button onclick="createUser()">Cadastrar</button><p id="uMsg"></p></div>
  \${DATA.members.map(u=>\`<div class="card row"><div><strong>\${esc(u.name)}</strong><div class="muted">\${esc(u.email)} · \${u.role==='admin'?'Administrador':'Integrante'} · \${u.active?'Ativo':'Desativado'}</div></div><div class="row">
  <button class="smallbtn alt" onclick="resetPass(\${u.id})">Alterar senha</button>
  <button class="smallbtn \${u.active?'danger':'alt'}" onclick="toggleUser(\${u.id},\${u.active?0:1})">\${u.active?'Desativar':'Ativar'}</button>
  </div></div>\`).join('')}\`;
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
  <div class="grid g2"><label>Data<input id="eDate" type="date"></label><label>Código do dia<input id="eDay" placeholder="Q, S, D, Sx"></label><label>Título<input id="eTitle"></label><label>Emoji<input id="eIcon" value="🎶"></label></div><br>
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
function showView(v){for(const x of ['schedule','users','settings']) id(x+'View').classList.toggle('hidden',x!==v)}
function id(x){return document.getElementById(x)} function val(x){return id(x).value}
function show(x){id(x).classList.remove('hidden')} function hide(x){id(x).classList.add('hidden')}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
init();
</script>
</body></html>`;
}
