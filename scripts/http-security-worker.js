import app from '../src/index.js';
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(request.method!=='POST'||url.pathname!=='/http-security')return new Response('Not found',{status:404});
  const event=await env.DB.prepare("SELECT id FROM events WHERE event_date='2099-01-11'").first();
  const member=await env.DB.prepare("SELECT id FROM users WHERE email='id01-integrante@vertical.invalid'").first();
  const admin=await env.DB.prepare("SELECT id FROM users WHERE email='id01-admin@vertical.invalid'").first();
  if(!event||!member||!admin)return Response.json({ok:false,error:'Fixtures ausentes'},{status:409});
  const expiry=new Date(Date.now()+3600000).toISOString();
  for(const [token,id] of [['http-member',member.id],['http-admin',admin.id]]){
   await env.DB.prepare('INSERT OR REPLACE INTO sessions(id,user_id,expires_at) VALUES(?,?,?)').bind(token,id,expiry).run();
  }
  const check=async(path,token,method='GET',payload,extraHeaders={})=>{
   const headers={...extraHeaders};
   if(token)headers.Cookie='louvor_session='+token;
   if(payload)headers['Content-Type']='application/json';
   const res=await app.fetch(new Request('http://localhost'+path,{method,headers,body:payload?JSON.stringify(payload):undefined}),env);
   return res.status;
  };
  const e=event.id;
  await env.DB.prepare('INSERT OR REPLACE INTO sessions(id,user_id,expires_at) VALUES(?,?,?)').bind('http-expired',member.id,new Date(Date.now()-60000).toISOString()).run();
   const disabled=await env.DB.prepare("SELECT id FROM users WHERE email='id03-integrante@vertical.invalid'").first();
   if(!disabled)return Response.json({ok:false,error:'Fixture ID03 ausente'},{status:409});
   await env.DB.prepare('UPDATE users SET active=0 WHERE id=?').bind(disabled.id).run();
   await env.DB.prepare('INSERT OR REPLACE INTO sessions(id,user_id,expires_at) VALUES(?,?,?)').bind('http-disabled',disabled.id,expiry).run();
   const checks={
   unauthenticated:(await check('/api/admin/attendance/event?eventId='+e))===401,
   readDenied:(await check('/api/admin/attendance/event?eventId='+e,'http-member'))===403,
   writeDenied:(await check('/api/admin/attendance','http-member','POST',{eventId:e,userId:member.id,status:'present',reason:'teste'}))===403,
   closeDenied:(await check('/api/admin/attendance/close','http-member','POST',{eventId:e}))===403,
   reportIsolation:(await check('/api/reports/participation?start=2099-01-01&end=2099-01-31&memberId='+admin.id,'http-member'))===403,
   ownReport:(await check('/api/reports/participation?start=2099-01-01&end=2099-01-31&memberId='+member.id,'http-member'))===200,
   adminRead:(await check('/api/admin/attendance/event?eventId='+e,'http-admin'))===200,
   expiredSession:(await check('/api/me','http-expired'))===401,
   disabledAccount:(await check('/api/me','http-disabled'))===401,
   crossOrigin:(await check('/api/admin/attendance','http-admin','POST',{eventId:e,userId:member.id,status:'present',reason:'teste'},{Origin:'https://example.invalid'}))===403,
   missingOrigin:(await check('/api/admin/attendance','http-admin','POST',{eventId:e,userId:member.id,status:'present',reason:'teste'}))===403,
   sameOrigin:(await check('/api/admin/attendance','http-admin','POST',{eventId:e,userId:member.id,status:'present',reason:'teste'},{Origin:'http://localhost'}))===200
  };
  const otherEvent=await env.DB.prepare("SELECT id FROM events WHERE id<>? ORDER BY id LIMIT 1").bind(e).first();
  if(!otherEvent)return Response.json({ok:false,error:'Segundo evento ausente'},{status:409});
  const assignment=await env.DB.prepare("SELECT role_id FROM team_assignments WHERE event_id=? AND user_id=? LIMIT 1").bind(e,member.id).first();
  if(!assignment)return Response.json({ok:false,error:'Escalacao do integrante ausente'},{status:409});
  await env.DB.prepare("UPDATE team_assignments SET is_leader=1,status='confirmed' WHERE event_id=? AND user_id=?").bind(e,member.id).run();
  const leaderOwnEvent=(await check('/api/admin/attendance/event?eventId='+e,'http-member'))===200;
  const leaderOtherEvent=(await check('/api/admin/attendance/event?eventId='+otherEvent.id,'http-member'))===403;
  await env.DB.prepare("UPDATE team_assignments SET is_leader=0 WHERE event_id=? AND user_id=?").bind(e,member.id).run();
  checks.leaderOwnEvent=leaderOwnEvent;
  checks.leaderOtherEventDenied=leaderOtherEvent;
  const ok=Object.values(checks).every(Boolean);
  return Response.json({ok,checks},{status:ok?200:500});
 }
};
