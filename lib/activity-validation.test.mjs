import assert from "node:assert/strict";
import test from "node:test";

const TITLE_MIN = 4;
const TITLE_MAX = 60;
const DESC_MAX = 1000;

function normalizeActivityTitle(title) {
  return title.trim().replace(/\s+/g, " ");
}

function isTitleVisible(title) {
  return title.trim().length >= TITLE_MIN;
}

function validateActivityTitle(title) {
  const t = normalizeActivityTitle(title);
  if (t.length < TITLE_MIN) return `Title must be at least ${TITLE_MIN} characters.`;
  if (t.length > TITLE_MAX) return `Title must be at most ${TITLE_MAX} characters.`;
  return null;
}

function validateActivityDescription(description) {
  const d = description.trim().replace(/\s+/g, " ");
  if (d.length > DESC_MAX) return `Description must be at most ${DESC_MAX} characters.`;
  return null;
}

test("isTitleVisible requires 4+ trimmed characters", () => {
  assert.equal(isTitleVisible("abc"), false);
  assert.equal(isTitleVisible("abcd"), true);
});

test("validateActivityTitle length bounds", () => {
  assert.match(validateActivityTitle("ab"), /at least/);
  assert.match(validateActivityTitle("a".repeat(61)), /at most/);
  assert.equal(validateActivityTitle("Sunrise hike"), null);
});

test("validateActivityDescription max 1000", () => {
  assert.match(validateActivityDescription("x".repeat(1001)), /at most/);
  assert.equal(validateActivityDescription("ok"), null);
});
