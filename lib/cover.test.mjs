import assert from "node:assert/strict";
import test from "node:test";
import { coverGradientSignature, getCover } from "./cover.mjs";

const IDS = [
  "a1111111-1111-4111-8111-111111111111",
  "b2222222-2222-4222-8222-222222222222",
  "c3333333-3333-4333-8333-333333333333",
];

test("three plan IDs produce three distinct gradients", () => {
  const signatures = IDS.map((id, stackIndex) =>
    coverGradientSignature(id, "coffee", stackIndex),
  );
  const unique = new Set(signatures);
  assert.equal(unique.size, 3);
});

test("neighboring stack indices shift hue by at least 25 degrees", () => {
  const id = IDS[0];
  const h0 = getCover(id, "coffee", { stackIndex: 0 }).hue;
  const h1 = getCover(id, "coffee", { stackIndex: 1 }).hue;
  const h2 = getCover(id, "coffee", { stackIndex: 2 }).hue;
  assert.ok(Math.abs(h1 - h0) >= 25);
  assert.ok(Math.abs(h2 - h1) >= 25);
});

test("muted covers differ from front covers", () => {
  const id = IDS[0];
  const front = getCover(id, "hiking", { stackIndex: 0, muted: false });
  const back = getCover(id, "hiking", { stackIndex: 0, muted: true });
  assert.notEqual(front.signature, back.signature);
});
