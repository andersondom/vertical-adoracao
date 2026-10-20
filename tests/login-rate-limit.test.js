import test from "node:test";
import assert from "node:assert/strict";
import { loginIdentityHash, isLoginBlocked, recordLoginFailure, clearLoginFailures } from "../src/auth/login-rate-limit.js";

test("identificador de login nao revela email nem IP", async () => {
  const a = await loginIdentityHash("USER@example.com", "192.0.2.1");
  const b = await loginIdentityHash("user@example.com", "192.0.2.1");
  const c = await loginIdentityHash("user@example.com", "192.0.2.2");
  assert.equal(a,b);
  assert.notEqual(a,c);
  assert.match(a,/^[0-9a-f]{64}$/);
});
test("limite consulta chave parametrizada", async () => {
  const db = { prepare(sql) { assert.match(sql,/identity_hash=\?/); return { bind(key) { assert.equal(key,"hash"); return { first:async()=>({locked_until:110}) }; } }; } };
  assert.equal(await isLoginBlocked(db,"hash",100),true);
  assert.equal(await isLoginBlocked(db,"hash",110),false);
});
test("falha registra tentativa com parametros, sucesso remove registro", async () => {
  let sqls=[];
  const db={prepare(sql){sqls.push(sql);return {bind(...args){return {run:async()=>({args})};}}}};
  await recordLoginFailure(db,"hash",100);
  await clearLoginFailures(db,"hash");
  assert.match(sqls[0],/ON CONFLICT/);
  assert.match(sqls[1],/DELETE FROM login_attempts/);
});
