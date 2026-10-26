import test from "node:test";
import assert from "node:assert/strict";
import { suggestTeam } from "../src/domain/team-suggestions.js";

const role = (userId, roleId, recentAssignments, available=true, active=true) =>
  ({userId,roleId,recentAssignments,available,active});

test("prioriza disponibilidade e menor carga recente", () => {
  const result=suggestTeam({requirements:[{roleId:1,slots:2,isLeader:false}],candidates:[
    role(1,1,8),role(2,1,0,false),role(3,1,2),role(4,1,1)]});
  assert.deepEqual(result.map(x=>x.userId),[4,3]);
});

test("respeita vagas existentes e evita duplicidade",()=>{
  const result=suggestTeam({requirements:[{roleId:1,slots:2,isLeader:false}],
    existing:[{userId:1,roleId:1,status:"confirmed",isLeader:false}],
    candidates:[role(1,1,0),role(2,1,1)]});
  assert.deepEqual(result.map(x=>x.userId),[2]);
});

test("não propõe segundo líder",()=>{
  const result=suggestTeam({requirements:[{roleId:3,slots:1,isLeader:true}],
    existing:[{userId:1,roleId:3,status:"reserved",isLeader:true}],
    candidates:[role(2,3,0)]});
  assert.deepEqual(result,[]);
});

test("ignora usuários inativos e aceita múltiplas funções",()=>{
  const result=suggestTeam({requirements:[{roleId:1,slots:1,isLeader:false},{roleId:2,slots:1,isLeader:false}],
    candidates:[role(1,1,0),role(1,2,0),role(2,1,0,true,false)]});
  assert.deepEqual(result.map(x=>[x.userId,x.roleId]),[[1,1],[1,2]]);
});

test("rejeita entradas malformadas",()=>{
  assert.throws(()=>suggestTeam({requirements:[{roleId:1,slots:-1,isLeader:false}],candidates:[]}),/Formação/);
});

test("liderança proposta bloqueia sugestão concorrente",()=>{
  const result=suggestTeam({
    requirements:[{roleId:3,slots:2,isLeader:true}],
    existing:[{userId:1,roleId:3,status:"proposed",isLeader:true}],
    candidates:[role(2,3,0),role(3,3,1)]
  });
  assert.deepEqual(result,[]);
});

test("permite nova sugestão após recusa da escala anterior",()=>{
  const result=suggestTeam({
    requirements:[{roleId:1,slots:1,isLeader:false}],
    existing:[{userId:1,roleId:1,status:"declined",isLeader:false}],
    candidates:[role(1,1,0),role(2,1,3)]
  });
  assert.deepEqual(result.map(x=>x.userId),[1]);
});

test("libera a liderança após recusa",()=>{
  const result=suggestTeam({
    requirements:[{roleId:3,slots:1,isLeader:true}],
    existing:[{userId:1,roleId:3,status:"declined",isLeader:true}],
    candidates:[role(2,3,1)]
  });
  assert.deepEqual(result.map(x=>x.userId),[2]);
});
