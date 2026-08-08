import assert from "node:assert/strict";
import test from "node:test";

import {
  createCycleMetadata,
  createCycleRolloverPlan,
  createSalaryDayChangePlan,
  normalizeLegacyIncomeEvents,
} from "./cycleManager.js";
import { getSalaryCycleDetails } from "./dateUtils.js";

const localDate = (year, month, day) => new Date(year, month - 1, day, 12);

const transaction = (dateKey, amount) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return {
    id: `${dateKey}-${amount}`,
    amount,
    type: "expense",
    category: "Food",
    createdAt: new Date(year, month - 1, day, 12).toISOString(),
  };
};

test("does not roll a 3rd-to-2nd cycle on the 1st or 2nd", () => {
  const cycle = getSalaryCycleDetails(localDate(2026, 8, 8), 3);
  const metadata = createCycleMetadata(cycle);
  const input = {
    metadata,
    settings: { salaryDay: 3, isSetupComplete: true },
    income: 3100,
  };

  assert.equal(
    createCycleRolloverPlan({ ...input, referenceDate: localDate(2026, 9, 1) }),
    null
  );
  assert.equal(
    createCycleRolloverPlan({ ...input, referenceDate: localDate(2026, 9, 2) }),
    null
  );
});

test("rollover archives once, carries balance, and starts the correct next cycle", () => {
  const cycle = getSalaryCycleDetails(localDate(2026, 8, 8), 3);
  const metadata = createCycleMetadata(cycle);
  const archivedAt = "2026-09-03T08:00:00.000Z";
  const firstPlan = createCycleRolloverPlan({
    referenceDate: localDate(2026, 9, 3),
    metadata,
    settings: { salaryDay: 3, isSetupComplete: true },
    income: 3100,
    expenses: [transaction("2026-08-03", 100)],
    archivedCycles: [],
    archivedAt,
  });

  assert.equal(firstPlan.archivedCycles.length, 1);
  assert.equal(firstPlan.archivedCycles[0].cycleStart, "2026-08-03");
  assert.equal(firstPlan.archivedCycles[0].cycleEnd, "2026-09-02");
  assert.equal(firstPlan.openingBalance, 3000);
  assert.equal(firstPlan.income, 0);
  assert.deepEqual(firstPlan.expenses, []);
  assert.deepEqual(firstPlan.incomeEvents, []);
  assert.equal(firstPlan.cycleMetadata.cycleStart, "2026-09-03");
  assert.equal(firstPlan.cycleMetadata.cycleEnd, "2026-10-02");

  const retryPlan = createCycleRolloverPlan({
    referenceDate: localDate(2026, 9, 3),
    metadata,
    settings: { salaryDay: 3, isSetupComplete: true },
    income: 3100,
    expenses: [transaction("2026-08-03", 100)],
    archivedCycles: firstPlan.archivedCycles,
    archivedAt,
  });

  assert.equal(retryPlan.archivedCycles.length, 1);

  const settledPlan = createCycleRolloverPlan({
    referenceDate: localDate(2026, 9, 3),
    metadata: firstPlan.cycleMetadata,
    settings: firstPlan.budgetSettings,
    income: firstPlan.income,
    openingBalance: firstPlan.openingBalance,
    expenses: firstPlan.expenses,
    incomeEvents: firstPlan.incomeEvents,
    archivedCycles: firstPlan.archivedCycles,
    archivedAt,
  });

  assert.equal(settledPlan, null);
});

test("a pending salary day activates at rollover", () => {
  const cycle = getSalaryCycleDetails(localDate(2026, 8, 8), 3);
  const metadata = {
    ...createCycleMetadata(cycle),
    cycleEnd: "2026-08-31",
  };
  const plan = createCycleRolloverPlan({
    referenceDate: localDate(2026, 9, 1),
    metadata,
    settings: {
      salaryDay: 3,
      pendingSalaryDay: 1,
      isSetupComplete: true,
    },
  });

  assert.equal(plan.budgetSettings.salaryDay, 1);
  assert.equal(plan.budgetSettings.pendingSalaryDay, null);
  assert.equal(plan.cycleMetadata.cycleStart, "2026-09-01");
  assert.equal(plan.cycleMetadata.cycleEnd, "2026-09-30");
});

test("salary-day changes preserve current records until the next selected boundary", () => {
  const metadata = createCycleMetadata(
    getSalaryCycleDetails(localDate(2026, 8, 8), 1)
  );
  const plan = createSalaryDayChangePlan({
    referenceDate: localDate(2026, 8, 8),
    metadata,
    settings: { salaryDay: 1, isSetupComplete: true },
    selectedSalaryDay: 3,
  });

  assert.equal(plan.cycleMetadata.cycleStart, "2026-08-01");
  assert.equal(plan.cycleMetadata.cycleEnd, "2026-09-02");
  assert.equal(plan.budgetSettings.salaryDay, 1);
  assert.equal(plan.budgetSettings.pendingSalaryDay, 3);
  assert.equal(plan.effectiveStart, "2026-09-03");
});

test("cancelling a pending change never ends the cycle before today", () => {
  const metadata = {
    ...createCycleMetadata(
      getSalaryCycleDetails(localDate(2026, 8, 8), 1)
    ),
    cycleEnd: "2026-09-02",
  };
  const plan = createSalaryDayChangePlan({
    referenceDate: localDate(2026, 9, 1),
    metadata,
    settings: {
      salaryDay: 1,
      pendingSalaryDay: 3,
      isSetupComplete: true,
    },
    selectedSalaryDay: 1,
  });

  assert.equal(plan.cycleMetadata.cycleEnd, "2026-09-30");
  assert.equal(plan.budgetSettings.pendingSalaryDay, null);
  assert.equal(plan.effectiveStart, "2026-10-01");
});

test("legacy base income becomes a dated cycle-start salary event", () => {
  const cycle = getSalaryCycleDetails(localDate(2026, 8, 8), 1);
  const events = normalizeLegacyIncomeEvents({
    income: 5000,
    incomeEvents: [
      {
        id: "later",
        amount: 1000,
        createdAt: localDate(2026, 8, 5).toISOString(),
      },
    ],
    cycle,
  });

  assert.equal(events.length, 2);
  assert.equal(events[0].amount, 4000);
  assert.equal(events[0].receivedOn, "2026-08-01");
  assert.equal(events[1].receivedOn, "2026-08-05");
});
