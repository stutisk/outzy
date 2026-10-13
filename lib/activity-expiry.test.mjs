import assert from "node:assert/strict";
import test from "node:test";

function getActivityEndIso(activity) {
  return activity.end_time ?? activity.activity_date;
}

function isActivityUpcoming(activity, now = new Date()) {
  return new Date(getActivityEndIso(activity)).getTime() > now.getTime();
}

const now = new Date("2026-06-15T12:00:00Z");

test("end time defaults to start", () => {
  assert.equal(
    getActivityEndIso({ activity_date: "2026-06-20T10:00:00Z" }),
    "2026-06-20T10:00:00Z",
  );
});

test("uses end_time when set", () => {
  assert.equal(
    getActivityEndIso({
      activity_date: "2026-06-20T10:00:00Z",
      end_time: "2026-06-20T14:00:00Z",
    }),
    "2026-06-20T14:00:00Z",
  );
});

test("upcoming vs past", () => {
  assert.equal(
    isActivityUpcoming({ activity_date: "2026-06-20T10:00:00Z" }, now),
    true,
  );
  assert.equal(
    isActivityUpcoming({ activity_date: "2026-06-10T10:00:00Z" }, now),
    false,
  );
});
