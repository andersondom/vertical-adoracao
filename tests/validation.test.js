import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeEmail,
  isEmail,
  isPositiveInteger,
  isValidDate
} from "../src/utils/validation.js";

test("normalizeEmail remove espaços e converte para minúsculas", () => {
  assert.equal(
    normalizeEmail("  USER@EXAMPLE.COM "),
    "user@example.com"
  );
});

test("isEmail reconhece e-mails válidos e inválidos", () => {
  assert.equal(isEmail("user@example.com"), true);
  assert.equal(isEmail("email-invalido"), false);
  assert.equal(isEmail("user@"), false);
});

test("isPositiveInteger aceita apenas inteiros positivos", () => {
  assert.equal(isPositiveInteger(1), true);
  assert.equal(isPositiveInteger("25"), true);
  assert.equal(isPositiveInteger(0), false);
  assert.equal(isPositiveInteger(-1), false);
  assert.equal(isPositiveInteger("abc"), false);
  assert.equal(isPositiveInteger(1.5), false);
});

test("isValidDate valida datas reais", () => {
  assert.equal(isValidDate("2026-09-24"), true);
  assert.equal(isValidDate("2026-02-29"), false);
  assert.equal(isValidDate("2024-02-29"), true);
  assert.equal(isValidDate("2026-13-01"), false);
  assert.equal(isValidDate("31/12/2026"), false);
});
