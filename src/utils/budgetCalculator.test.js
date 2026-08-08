import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateAnalyticsMetrics,
  calculateBudgetMetrics,
} from "./budgetCalculator.js";
import { addDaysToDateKey } from "./dateUtils.js";

const atLocalNoon = (dateKey) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day, 12).toISOString();
};

const transaction = (dateKey, amount, type = "expense") => ({
  id: `${type}-${dateKey}-${amount}`,
  amount,
  type,
  category: type === "income" ? null : "Food",
  description:
    type === "income"
      ? "Side income"
      : type === "fixedExpense"
        ? "Major expense"
        : "Expense",
  createdAt: atLocalNoon(dateKey),
});

const incomeEvent = (dateKey, amount) => ({
  id: `salary-${dateKey}-${amount}`,
  amount,
  type: "salary",
  receivedOn: dateKey,
  createdAt: atLocalNoon(dateKey),
});

const makeCycle = ({
  startKey = "2026-01-01",
  totalDays = 30,
  currentDay = 1,
} = {}) => ({
  id: startKey,
  startKey,
  endKey: addDaysToDateKey(startKey, totalDays - 1),
  totalDays,
  daysInCycle: totalDays,
  currentDay,
  remainingDays: totalDays - currentDay + 1,
});

const budgetMetrics = ({
  income = 0,
  expenses = [],
  currentDay = 1,
  totalDays = 30,
  startKey = "2026-01-01",
  openingBalance = 0,
  incomeEvents = [],
} = {}) =>
  calculateBudgetMetrics({
    income,
    expenses,
    openingBalance,
    incomeEvents,
    cycle: makeCycle({ startKey, totalDays, currentDay }),
  });

const assertNearlyEqual = (actual, expected) => {
  assert.ok(
    Math.abs(actual - expected) < 0.000001,
    `Expected ${actual} to be nearly ${expected}`
  );
};

test("uses a fixed salary-per-day limit without double-counting today", () => {
  const metrics = budgetMetrics({ income: 6000 });

  assert.equal(metrics.baseDailyBudget, 200);
  assert.equal(metrics.dailyBudget, 200);
  assert.equal(metrics.carryForward, 200);
  assert.equal(metrics.maxLimit, 200);
  assert.equal(metrics.safeSpendingToday, 200);
});

test("carries unused money forward and renews the next daily allocation", () => {
  const metrics = budgetMetrics({
    income: 6000,
    expenses: [
      transaction("2026-01-01", 150),
      transaction("2026-01-02", 100),
    ],
    currentDay: 2,
  });

  assert.equal(metrics.baseDailyBudget, 200);
  assert.equal(metrics.previousCarryForward, 50);
  assert.equal(metrics.remainingToday, 100);
  assert.equal(metrics.carryForward, 150);
  assert.equal(metrics.maxLimit, 150);
});

test("overspending creates negative carry but the next allocation renews", () => {
  const metrics = budgetMetrics({
    income: 3000,
    expenses: [transaction("2026-01-01", 150)],
    currentDay: 2,
  });

  assert.equal(metrics.baseDailyBudget, 100);
  assert.equal(metrics.previousCarryForward, -50);
  assert.equal(metrics.remainingToday, 100);
  assert.equal(metrics.carryForward, 50);
});

test("side income increases the limit from its actual cycle date", () => {
  const metrics = budgetMetrics({
    income: 3000,
    expenses: [
      transaction("2026-01-01", 80),
      transaction("2026-01-02", 50, "income"),
      transaction("2026-01-02", 30),
    ],
    currentDay: 2,
  });

  assert.equal(metrics.baseDailyBudget, 100 + 50 / 29);
  assert.equal(metrics.previousCarryForward, 20);
  assert.equal(metrics.remainingToday, 70 + 50 / 29);
  assert.equal(metrics.carryForward, 90 + 50 / 29);
  assert.equal(metrics.maxLimit, 90 + 50 / 29);
});

test("dated salary is allocated only from the received date", () => {
  const metrics = budgetMetrics({
    income: 5900,
    incomeEvents: [incomeEvent("2026-01-02", 2900)],
    currentDay: 2,
  });

  assert.equal(metrics.baseCycleIncome, 3000);
  assert.equal(metrics.receivedSalary, 2900);
  assert.equal(metrics.baseDailyBudget, 200);
  assert.equal(metrics.previousCarryForward, 100);
  assert.equal(metrics.carryForward, 300);
});

test("opening balance and salary combine without changing receipt timing", () => {
  const metrics = budgetMetrics({
    income: 30000,
    openingBalance: 3000,
  });

  assert.equal(metrics.openingBalance, 3000);
  assert.equal(metrics.cycleIncome, 30000);
  assert.equal(metrics.cycleFunds, 33000);
  assert.equal(metrics.baseDailyBudget, 1100);
  assert.equal(metrics.remainingBalance, 33000);
});

test("major expenses reduce carry-forward and remaining balance once", () => {
  const metrics = budgetMetrics({
    income: 6000,
    expenses: [
      transaction("2026-01-01", 600, "fixedExpense"),
      transaction("2026-01-01", 100),
    ],
  });

  assert.equal(metrics.totalFixedExpenses, 600);
  assert.equal(metrics.totalSpent, 100);
  assert.equal(metrics.remainingToday, 100);
  assert.equal(metrics.carryForward, -500);
  assert.equal(metrics.maxLimit, -500);
  assert.equal(metrics.safeSpendingToday, 0);
  assert.equal(metrics.remainingBalance, 5300);
});

test("cycle-end carry-forward equals the remaining balance", () => {
  const metrics = budgetMetrics({
    income: 5900,
    incomeEvents: [incomeEvent("2026-01-02", 2900)],
    currentDay: 30,
  });

  assertNearlyEqual(metrics.carryForward, 5900);
  assertNearlyEqual(metrics.remainingBalance, 5900);
  assertNearlyEqual(metrics.savings, 5900);
});

test("a 3rd-to-2nd cycle indexes both months without collisions", () => {
  const metrics = budgetMetrics({
    income: 3100,
    expenses: [
      transaction("2026-08-02", 999),
      transaction("2026-08-03", 25),
      transaction("2026-09-02", 50),
      transaction("2026-09-03", 999),
    ],
    startKey: "2026-08-03",
    totalDays: 31,
    currentDay: 31,
  });

  assert.equal(metrics.totalSpent, 75);
  assert.equal(metrics.spentToday, 50);
  assert.equal(metrics.previousCarryForward, 2975);
  assert.equal(metrics.remainingToday, 50);
  assert.equal(metrics.carryForward, 3025);
  assert.equal(metrics.remainingBalance, 3025);
});

test("late salary in a cross-month cycle uses only remaining cycle days", () => {
  const metrics = budgetMetrics({
    income: 2600,
    openingBalance: 310,
    incomeEvents: [incomeEvent("2026-08-08", 2600)],
    startKey: "2026-08-03",
    totalDays: 31,
    currentDay: 6,
  });

  assert.equal(metrics.baseDailyBudget, 110);
  assert.equal(metrics.dailyBudgetTotals[0], 10);
  assert.equal(metrics.dailyBudgetTotals[4], 10);
  assert.equal(metrics.dailyBudgetTotals[5], 110);
  assert.equal(metrics.previousCarryForward, 50);
  assert.equal(metrics.carryForward, 160);
  assert.equal(metrics.maxLimit, 160);
  assert.equal(metrics.totalAvailableFunds, 2910);
});

test("analytics uses cycle offsets and excludes major/out-of-cycle expenses", () => {
  const cycle = makeCycle({
    startKey: "2026-08-03",
    totalDays: 31,
    currentDay: 31,
  });
  const analytics = calculateAnalyticsMetrics({
    cycle,
    expenses: [
      transaction("2026-08-02", 700),
      transaction("2026-08-03", 50),
      transaction("2026-09-01", 75),
      transaction("2026-09-01", 500, "fixedExpense"),
    ],
  });

  assert.equal(analytics.totalSpent, 125);
  assert.equal(analytics.dailySpending[0].amount, 50);
  assert.equal(analytics.dailySpending[29].amount, 75);
  assert.equal(analytics.dailySpending[30].amount, 0);
  assert.equal(analytics.maxDailySpend, 75);
  assert.deepEqual(analytics.categoryBreakdown, [
    { category: "Food", amount: 125, percent: 100 },
  ]);
});
