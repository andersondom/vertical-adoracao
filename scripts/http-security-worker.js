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
  const check=async(path,token,method='GET',payload)=>{
   const headers={};
   if(token)headers.Cookie='louvor_session='+token;
   if(payload)headers['Content-Type']='application/json';
   const res=await app.fetch(new Request('http://localhost'+path,{method,headers,body:payload?JSON.stringify(payload):undefined}),env);
   return res.status;
  };
  const e=event.id;
  const checks={
   unauthenticated:(await check('/api/admin/attendance/event?eventId='+e))===401,
   readDenied:(await check('/api/admin/attendance/event?eventId='+e,'http-member'))===403,
   writeDenied:(await check('/api/admin/attendance','http-member','POST',{eventId:e,userId:member.id,status:'present',reason:'teste'}))===403,
   closeDenied:(await check('/api/admin/attendance/close','http-member','POST',{eventId:e}))===403,
   reportIsolation:(await check('/api/reports/participation?start=2099-01-01&end=2099-01-31&memberId='+admin.id,'http-member'))===403,
   ownReport:(await check('/api/reports/participation?start=2099-01-01&end=2099-01-31&memberId='+member.id,'http-member'))===200,
   adminRead:(await check('/api/admin/attendance/event?eventId='+e,'http-admin'))===200
  };
  const ok=Object.values(checks).every(Boolean);
  return Response.json({ok,checks},{status:ok?200:500});
 }
};
