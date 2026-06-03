import assert from "node:assert/strict";
import test from "node:test";

import { calculateBudgetMetrics } from "./budgetCalculator.js";

const transaction = (day, amount, type = "expense") => ({
  id: `${type}-${day}-${amount}`,
  amount,
  type,
  category: type === "expense" ? "Food" : null,
  description: type === "expense" ? "Expense" : "Side income",
  createdAt: new Date(Date.UTC(2026, 0, day, 12)).toISOString(),
});

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

test("side income increases carry-forward without changing the fixed daily limit", () => {
  const metrics = calculateBudgetMetrics(
    3000,
    [transaction(1, 80), transaction(2, 50, "income"), transaction(2, 30)],
    2,
    30
  );

  assert.equal(metrics.baseDailyBudget, 100);
  assert.equal(metrics.dailyBudget, 70);
  assert.equal(metrics.previousCarryForward, 20);
  assert.equal(metrics.sideIncomeToday, 50);
  assert.equal(metrics.availableToday, 100);
  assert.equal(metrics.spentToday, 30);
  assert.equal(metrics.remainingToday, 70);
  assert.equal(metrics.carryForward, 140);
  assert.equal(metrics.maxLimit, 210);
});

test("final-day carry-forward equals savings and remaining balance", () => {
  const metrics = calculateBudgetMetrics(
    6000,
    [transaction(1, 150), transaction(2, 100), transaction(3, 25, "income")],
    30,
    30
  );

  assert.equal(metrics.baseDailyBudget, 200);
  assert.equal(metrics.dailyBudget, 200);
  assert.equal(metrics.remainingBalance, 5775);
  assert.equal(metrics.carryForward, 5775);
  assert.equal(metrics.savings, 5775);
  assert.equal(metrics.remainingToday, 200);
});
