import test from "node:test";
import assert from "node:assert/strict";

import { requireAdmin } from "../src/auth/authorization.js";

test("requireAdmin permite administrador", () => {
  assert.doesNotThrow(() => {
    requireAdmin({
      user: {
        role: "admin"
      }
    });
  });
});

test("requireAdmin bloqueia integrante comum com status 403", () => {
  assert.throws(
    () => {
      requireAdmin({
        user: {
          role: "member"
        }
      });
    },
    error => {
      assert.equal(error.message, "Acesso negado.");
      assert.equal(error.status, 403);
      return true;
    }
  );
});
