import assert from "node:assert/strict";
import test from "node:test";

import { calculateAnalyticsMetrics, calculateBudgetMetrics } from "./budgetCalculator.js";

const transaction = (day, amount, type = "expense") => ({
  id: `${type}-${day}-${amount}`,
  amount,
  type,
  category: type === "income" ? null : "Food",
  description: type === "income" ? "Side income" : type === "fixedExpense" ? "Major expense" : "Expense",
  createdAt: new Date(Date.UTC(2026, 0, day, 12)).toISOString(),
});

const incomeEvent = (day, amount) => ({
  id: `income-event-${day}-${amount}`,
  amount,
  createdAt: new Date(Date.UTC(2026, 0, day, 12)).toISOString(),
});

const assertNearlyEqual = (actual, expected) => {
  assert.ok(
    Math.abs(actual - expected) < 0.000001,
    `Expected ${actual} to be nearly ${expected}`
  );
};

test("uses a fixed salary-per-day limit", () => {
  const metrics = calculateBudgetMetrics(6000, [], 1, 30);

  assert.equal(metrics.baseDailyBudget, 200);
  assert.equal(metrics.dailyBudget, 200);
  assert.equal(metrics.availableToday, 200);
  assert.equal(metrics.remainingToday, 200);
  assert.equal(metrics.carryForward, 200);
  assert.equal(metrics.maxLimit, 400);
});

test("carries unused money from day 1", () => {
  const metrics = calculateBudgetMetrics(6000, [transaction(1, 150)], 1, 30);

  assert.equal(metrics.baseDailyBudget, 200);
  assert.equal(metrics.dailyBudget, 50);
  assert.equal(metrics.previousCarryForward, 0);
  assert.equal(metrics.availableToday, 200);
  assert.equal(metrics.spentToday, 150);
  assert.equal(metrics.remainingToday, 50);
  assert.equal(metrics.carryForward, 50);
  assert.equal(metrics.maxLimit, 100);
});

test("renews the daily limit each day and keeps carry-forward separate", () => {
  const metrics = calculateBudgetMetrics(
    6000,
    [transaction(1, 150), transaction(2, 100)],
    2,
    30
  );

  assert.equal(metrics.baseDailyBudget, 200);
  assert.equal(metrics.dailyBudget, 100);
  assert.equal(metrics.previousCarryForward, 50);
  assert.equal(metrics.availableToday, 200);
  assert.equal(metrics.spentToday, 100);
  assert.equal(metrics.remainingToday, 100);
  assert.equal(metrics.carryForward, 150);
  assert.equal(metrics.maxLimit, 250);
});

test("overspending creates negative carry while the next daily limit renews", () => {
  const metrics = calculateBudgetMetrics(3000, [transaction(1, 150)], 2, 30);

  assert.equal(metrics.baseDailyBudget, 100);
  assert.equal(metrics.dailyBudget, 100);
  assert.equal(metrics.previousCarryForward, -50);
  assert.equal(metrics.availableToday, 100);
  assert.equal(metrics.spentToday, 0);
  assert.equal(metrics.remainingToday, 100);
  assert.equal(metrics.carryForward, 50);
});

test("side income increases daily limit without directly adding to carry-forward", () => {
  const metrics = calculateBudgetMetrics(
    3000,
    [transaction(1, 80), transaction(2, 50, "income"), transaction(2, 30)],
    2,
    30
  );

  assert.equal(metrics.baseDailyBudget, 100 + 50 / 29);
  assert.equal(metrics.dailyBudget, 70 + 50 / 29);
  assert.equal(metrics.previousCarryForward, 20);
  assert.equal(metrics.sideIncomeToday, 50);
  assert.equal(metrics.availableToday, 100 + 50 / 29);
  assert.equal(metrics.spentToday, 30);
  assert.equal(metrics.remainingToday, 70 + 50 / 29);
  assert.equal(metrics.carryForward, 90 + 50 / 29);
  assert.equal(metrics.maxLimit, 160 + (100 / 29));
});

test("final-day carry-forward equals savings and remaining balance", () => {
  const metrics = calculateBudgetMetrics(
    6000,
    [transaction(1, 150), transaction(2, 100), transaction(3, 25, "income")],
    30,
    30
  );

  assert.equal(metrics.baseDailyBudget, 200 + 25 / 28);
  assert.equal(metrics.dailyBudget, 200 + 25 / 28);
  assert.equal(metrics.remainingBalance, 5775);
  assertNearlyEqual(metrics.carryForward, 5775);
  assertNearlyEqual(metrics.savings, 5775);
  assert.equal(metrics.remainingToday, 200 + 25 / 28);
});

test("uses previous month remaining balance before salary is added", () => {
  const metrics = calculateBudgetMetrics(0, [], 1, 30, 3000);

  assert.equal(metrics.openingBalance, 3000);
  assert.equal(metrics.monthlyFunds, 3000);
  assert.equal(metrics.baseDailyBudget, 100);
  assert.equal(metrics.remainingBalance, 3000);
  assert.equal(metrics.remainingToday, 100);
});

test("adds salary on top of previous month remaining balance", () => {
  const metrics = calculateBudgetMetrics(30000, [], 1, 30, 3000);

  assert.equal(metrics.openingBalance, 3000);
  assert.equal(metrics.monthlyIncome, 30000);
  assert.equal(metrics.monthlyFunds, 33000);
  assert.equal(metrics.baseDailyBudget, 1100);
  assert.equal(metrics.remainingBalance, 33000);
});

test("added income increases daily limit from added day without changing previous carry", () => {
  const metrics = calculateBudgetMetrics(
    5900,
    [],
    2,
    30,
    0,
    [incomeEvent(2, 2900)]
  );

  assert.equal(metrics.monthlyIncome, 5900);
  assert.equal(metrics.baseMonthlyIncome, 3000);
  assert.equal(metrics.totalAddedIncome, 2900);
  assert.equal(metrics.baseDailyBudget, 200);
  assert.equal(metrics.previousCarryForward, 100);
  assert.equal(metrics.remainingToday, 200);
  assert.equal(metrics.carryForward, 300);
});

test("added income only becomes carry-forward through unspent daily limit", () => {
  const metrics = calculateBudgetMetrics(
    5900,
    [transaction(2, 50)],
    2,
    30,
    0,
    [incomeEvent(2, 2900)]
  );

  assert.equal(metrics.baseDailyBudget, 200);
  assert.equal(metrics.spentToday, 50);
  assert.equal(metrics.remainingToday, 150);
  assert.equal(metrics.previousCarryForward, 100);
  assert.equal(metrics.carryForward, 250);
  assert.equal(metrics.remainingBalance, 5850);
});

test("added income recalculation starts from the added day only", () => {
  const metrics = calculateBudgetMetrics(
    8100,
    [],
    10,
    30,
    0,
    [incomeEvent(10, 2100)]
  );

  assert.equal(metrics.baseDailyBudget, 300);
  assert.equal(metrics.previousCarryForward, 1800);
  assert.equal(metrics.remainingToday, 300);
  assert.equal(metrics.carryForward, 2100);
});

test("carry-forward is the running total of daily limit minus daily expense", () => {
  const metrics = calculateBudgetMetrics(
    4000,
    [transaction(1, 50), transaction(2, 20)],
    2,
    20
  );

  assert.equal(metrics.baseDailyBudget, 200);
  assert.equal(metrics.previousCarryForward, 150);
  assert.equal(metrics.carryForward, 330);
});

test("added income is fully allocated by month end", () => {
  const metrics = calculateBudgetMetrics(
    5900,
    [],
    30,
    30,
    0,
    [incomeEvent(2, 2900)]
  );

  assert.equal(metrics.remainingBalance, 5900);
  assert.equal(metrics.carryForward, 5900);
  assert.equal(metrics.savings, 5900);
});

test("major expenses deduct from carry-forward and remaining balance", () => {
  const metrics = calculateBudgetMetrics(
    6000,
    [transaction(1, 600, "fixedExpense"), transaction(1, 100)],
    1,
    30
  );

  assert.equal(metrics.grossMonthlyFunds, 6000);
  assert.equal(metrics.totalFixedExpenses, 600);
  assert.equal(metrics.totalSpent, 100);
  assert.equal(metrics.totalExpenses, 700);
  assert.equal(metrics.monthlyFunds, 6000);
  assert.equal(metrics.baseDailyBudget, 200);
  assert.equal(metrics.remainingBalance, 5300);
  assert.equal(metrics.spentToday, 100);
  assert.equal(metrics.remainingToday, 100);
  assert.equal(metrics.carryForward, -500);
  assert.equal(metrics.maxLimit, -400);
});

test("major expenses do not count as daily spending or lower the fixed daily limit", () => {
  const metrics = calculateBudgetMetrics(
    3000,
    [transaction(2, 300, "fixedExpense")],
    2,
    30
  );

  assert.equal(metrics.monthlyFunds, 3000);
  assert.equal(metrics.baseDailyBudget, 100);
  assert.equal(metrics.spentToday, 0);
  assert.equal(metrics.remainingToday, 100);
  assert.equal(metrics.previousCarryForward, 100);
  assert.equal(metrics.carryForward, -100);
  assert.equal(metrics.remainingBalance, 2700);
});

test("analytics excludes major expenses from daily trends and category spending", () => {
  const analytics = calculateAnalyticsMetrics(
    [transaction(1, 50), transaction(1, 500, "fixedExpense")],
    1,
    30
  );

  assert.equal(analytics.totalSpent, 50);
  assert.equal(analytics.dailySpending[0].amount, 50);
  assert.equal(analytics.maxDailySpend, 50);
  assert.deepEqual(analytics.categoryBreakdown, [
    {
      category: "Food",
      amount: 50,
      percent: 100,
    },
  ]);
});
