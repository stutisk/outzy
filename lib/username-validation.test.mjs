import assert from "node:assert/strict";
import test from "node:test";

const USERNAME_MIN = 2;
const USERNAME_MAX = 12;

function normalizeUsername(raw) {
  return raw.trim().replace(/\s+/g, "");
}

function validateUsername(raw) {
  const username = normalizeUsername(raw);
  if (username.length < USERNAME_MIN) {
    return `Username must be at least ${USERNAME_MIN} characters.`;
  }
  if (username.length > USERNAME_MAX) {
    return `Username must be at most ${USERNAME_MAX} characters.`;
  }
  return null;
}

function usernameForSave(raw) {
  return normalizeUsername(raw).slice(0, USERNAME_MAX);
}

test("username length bounds", () => {
  assert.equal(validateUsername("a"), "Username must be at least 2 characters.");
  assert.equal(validateUsername("ab"), null);
  assert.equal(validateUsername("a".repeat(12)), null);
  assert.equal(validateUsername("a".repeat(13)), "Username must be at most 12 characters.");
});

test("usernameForSave truncates to 12", () => {
  assert.equal(usernameForSave("  hello_world  "), "hello_world");
  assert.equal(usernameForSave("abcdefghijklm").length, 12);
});
