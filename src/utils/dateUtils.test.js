import assert from "node:assert/strict";
import test from "node:test";

import {
  addDaysToDateKey,
  formatCycleRange,
  getCycleDayIndex,
  getNextSalaryDateKey,
  getSalaryCycleDetails,
} from "./dateUtils.js";

const localDate = (year, month, day) => new Date(year, month - 1, day, 12);

test("salary day 3 keeps the 1st and 2nd in the previous cycle", () => {
  const augustSecond = getSalaryCycleDetails(localDate(2026, 8, 2), 3);
  const augustThird = getSalaryCycleDetails(localDate(2026, 8, 3), 3);

  assert.equal(augustSecond.startKey, "2026-07-03");
  assert.equal(augustSecond.endKey, "2026-08-02");
  assert.equal(augustSecond.currentDay, 31);
  assert.equal(augustThird.startKey, "2026-08-03");
  assert.equal(augustThird.endKey, "2026-09-02");
  assert.equal(augustThird.currentDay, 1);
  assert.equal(augustThird.totalDays, 31);
  assert.equal(formatCycleRange(augustThird), "3 Aug\u20132 Sep 2026");
});

test("salary cycles cross the year boundary", () => {
  const cycle = getSalaryCycleDetails(localDate(2027, 1, 2), 3);

  assert.equal(cycle.startKey, "2026-12-03");
  assert.equal(cycle.endKey, "2027-01-02");
  assert.equal(cycle.currentDay, 31);
  assert.equal(cycle.totalDays, 31);
});

test("February cycle length follows leap years", () => {
  const leapCycle = getSalaryCycleDetails(localDate(2028, 2, 3), 3);
  const regularCycle = getSalaryCycleDetails(localDate(2027, 2, 3), 3);

  assert.equal(leapCycle.endKey, "2028-03-02");
  assert.equal(leapCycle.totalDays, 29);
  assert.equal(regularCycle.endKey, "2027-03-02");
  assert.equal(regularCycle.totalDays, 28);
});

test("salary days 29 to 31 clamp to shorter month end", () => {
  const january = getSalaryCycleDetails(localDate(2027, 1, 31), 31);
  const february = getSalaryCycleDetails(localDate(2027, 2, 28), 31);

  assert.equal(january.startKey, "2027-01-31");
  assert.equal(january.endKey, "2027-02-27");
  assert.equal(january.totalDays, 28);
  assert.equal(february.startKey, "2027-02-28");
  assert.equal(february.endKey, "2027-03-30");
  assert.equal(february.totalDays, 31);
});

test("cycle indexing uses complete local dates", () => {
  const cycle = getSalaryCycleDetails(localDate(2026, 8, 8), 3);

  assert.equal(getCycleDayIndex("2026-08-03", cycle), 0);
  assert.equal(getCycleDayIndex("2026-09-01", cycle), 29);
  assert.equal(getCycleDayIndex("2026-09-02", cycle), 30);
  assert.equal(getCycleDayIndex("2026-08-02", cycle), null);
  assert.equal(getCycleDayIndex("2026-09-03", cycle), null);
  assert.equal(getCycleDayIndex("not-a-date", cycle), null);
});

test("next salary date is strictly after today unless requested otherwise", () => {
  const augustThird = localDate(2026, 8, 3);

  assert.equal(getNextSalaryDateKey(augustThird, 3), "2026-09-03");
  assert.equal(getNextSalaryDateKey(augustThird, 3, true), "2026-08-03");
  assert.equal(addDaysToDateKey("2026-09-03", -1), "2026-09-02");
});
