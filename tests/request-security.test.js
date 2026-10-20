import test from "node:test";
import assert from "node:assert/strict";
import { isAllowedMutationOrigin } from "../src/auth/request-security.js";

const req = (method, headers = {}) =>
  new Request("https://vertical.example/api/availability", { method, headers });

test("GET permite leitura sem Origin", () => {
  assert.equal(isAllowedMutationOrigin(req("GET")), true);
});
test("POST de mesma origem e permitido", () => {
  assert.equal(isAllowedMutationOrigin(req("POST", { Origin: "https://vertical.example", Cookie: "louvor_session=abc" })), true);
});
test("POST de origem externa e bloqueado", () => {
  assert.equal(isAllowedMutationOrigin(req("POST", { Origin: "https://evil.example", Cookie: "louvor_session=abc" })), false);
});
test("POST com Origin invalido e bloqueado", () => {
  assert.equal(isAllowedMutationOrigin(req("POST", { Origin: "null", Cookie: "louvor_session=abc" })), false);
});
test("POST autenticado sem Origin ou Referer e bloqueado", () => {
  assert.equal(isAllowedMutationOrigin(req("POST", { Cookie: "louvor_session=abc" })), false);
});
test("POST sem cookie permite fluxo de bootstrap/login", () => {
  assert.equal(isAllowedMutationOrigin(req("POST")), true);
});
test("POST com referer de mesma origem e permitido", () => {
  assert.equal(isAllowedMutationOrigin(req("POST", { Referer: "https://vertical.example/app", Cookie: "louvor_session=abc" })), true);
});
