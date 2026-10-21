import test from "node:test";
import assert from "node:assert/strict";

import {
  PBKDF2_ITERATIONS,
  hashPassword,
  verifyPassword,
  randomToken
} from "../src/auth/crypto.js";

test("hashPassword gera hash e salt", async () => {
  const result = await hashPassword("senha-segura-123");

  assert.ok(result.hash);
  assert.ok(result.salt);
  assert.notEqual(result.hash, "senha-segura-123");
});

test("verifyPassword reconhece senha correta", async () => {
  const password = "senha-segura-123";
  const { hash, salt } = await hashPassword(password);

  assert.equal(
    await verifyPassword(password, hash, salt),
    true
  );
});

test("verifyPassword rejeita senha incorreta", async () => {
  const { hash, salt } = await hashPassword("senha-correta");

  assert.equal(
    await verifyPassword("senha-incorreta", hash, salt),
    false
  );
});

test("randomToken gera tokens distintos", () => {
  const token1 = randomToken();
  const token2 = randomToken();

  assert.ok(token1.length > 20);
  assert.ok(token2.length > 20);
  assert.notEqual(token1, token2);
});

test("PBKDF2 respeita o limite de 100000 iteracoes do Cloudflare Workers", async () => {
  assert.equal(PBKDF2_ITERATIONS, 100000);
  const { hash, salt } = await hashPassword("senha-compativel-staging");
  assert.equal(await verifyPassword("senha-compativel-staging", hash, salt), true);
});
