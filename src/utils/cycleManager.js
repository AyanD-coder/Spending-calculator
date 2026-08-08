import { calculateBudgetMetrics } from "./budgetCalculator.js";
import {
  addDaysToDateKey,
  getCycleDetailsFromMetadata,
  getLocalDateKey,
  getNextSalaryDateKey,
  getSalaryCycleDetails,
  isDateAfterCycle,
  sanitizeSalaryDay,
} from "./dateUtils.js";

export const STORAGE_VERSION = 2;

export const DEFAULT_BUDGET_SETTINGS = {
  version: STORAGE_VERSION,
  salaryDay: 1,
  pendingSalaryDay: null,
  isSetupComplete: false,
};

export const createCycleMetadata = (cycle) => ({
  version: STORAGE_VERSION,
  cycleId: cycle.id,
  cycleStart: cycle.startKey,
  cycleEnd: cycle.endKey,
  salaryDay: sanitizeSalaryDay(cycle.salaryDay),
});

export const normalizeBudgetSettings = (settings = {}) => ({
  ...DEFAULT_BUDGET_SETTINGS,
  ...settings,
  version: STORAGE_VERSION,
  salaryDay: sanitizeSalaryDay(settings.salaryDay),
  pendingSalaryDay:
    settings.pendingSalaryDay === null ||
    settings.pendingSalaryDay === undefined
      ? null
      : sanitizeSalaryDay(settings.pendingSalaryDay),
  isSetupComplete: Boolean(settings.isSetupComplete),
});

export const normalizeLegacyIncomeEvents = ({
  income = 0,
  incomeEvents = [],
  cycle,
}) => {
  const normalizedEvents = incomeEvents
    .filter((event) => Number(event.amount) > 0)
    .map((event) => ({
      ...event,
      type: event.type || "salary",
      receivedOn:
        event.receivedOn || getLocalDateKey(event.createdAt) || cycle.startKey,
    }));
  const datedIncome = normalizedEvents.reduce(
    (sum, event) => sum + (Number(event.amount) || 0),
    0
  );
  const legacyBaseIncome = (Number(income) || 0) - datedIncome;

  if (legacyBaseIncome > 0) {
    normalizedEvents.unshift({
      id: `legacy-salary-${cycle.id}`,
      amount: legacyBaseIncome,
      type: "salary",
      receivedOn: cycle.startKey,
      createdAt: new Date().toISOString(),
    });
  }

  return normalizedEvents;
};

export const createSalaryDayChangePlan = ({
  referenceDate = new Date(),
  metadata,
  settings,
  selectedSalaryDay,
}) => {
  if (!metadata) return null;

  const safeSettings = normalizeBudgetSettings(settings);
  const activeSalaryDay = sanitizeSalaryDay(
    metadata.salaryDay || safeSettings.salaryDay
  );
  const nextSalaryDay = sanitizeSalaryDay(selectedSalaryDay);

  if (
    nextSalaryDay === activeSalaryDay &&
    !safeSettings.pendingSalaryDay
  ) {
    return {
      cycleMetadata: metadata,
      budgetSettings: {
        ...safeSettings,
        salaryDay: activeSalaryDay,
        pendingSalaryDay: null,
        isSetupComplete: true,
      },
      effectiveStart: null,
    };
  }

  const effectiveStart = getNextSalaryDateKey(
    referenceDate,
    nextSalaryDay
  );

  return {
    cycleMetadata: {
      ...metadata,
      cycleEnd: addDaysToDateKey(effectiveStart, -1),
    },
    budgetSettings: {
      ...safeSettings,
      salaryDay: activeSalaryDay,
      pendingSalaryDay:
        nextSalaryDay === activeSalaryDay ? null : nextSalaryDay,
      isSetupComplete: true,
    },
    effectiveStart,
  };
};

const archiveExists = (archives, cycleId) =>
  archives.some(
    (archive) =>
      archive.cycleId === cycleId || archive.cycleStart === cycleId
  );

export const createCycleRolloverPlan = ({
  referenceDate = new Date(),
  metadata,
  settings,
  income = 0,
  openingBalance = 0,
  expenses = [],
  incomeEvents = [],
  archivedCycles = [],
  archivedAt = new Date().toISOString(),
}) => {
  if (!metadata || !isDateAfterCycle(referenceDate, metadata)) return null;

  const currentCycle = getCycleDetailsFromMetadata(metadata, referenceDate);
  if (!currentCycle) return null;

  const safeSettings = normalizeBudgetSettings(settings);
  const metrics = calculateBudgetMetrics({
    income,
    expenses,
    cycle: currentCycle,
    openingBalance,
    incomeEvents,
  });
  const archiveEntry = {
    version: STORAGE_VERSION,
    cycleId: metadata.cycleId || metadata.cycleStart,
    cycleStart: metadata.cycleStart,
    cycleEnd: metadata.cycleEnd,
    salaryDay: metadata.salaryDay,
    openingBalance: Number(openingBalance) || 0,
    income: Number(income) || 0,
    totalSpent: metrics.totalSpent,
    totalFixedExpenses: metrics.totalFixedExpenses,
    totalExpenses: metrics.totalExpenses,
    totalSideIncome: metrics.totalSideIncome,
    remainingBalance: metrics.remainingBalance,
    expenses,
    incomeEvents,
    archivedAt,
  };
  const nextSalaryDay = sanitizeSalaryDay(
    safeSettings.pendingSalaryDay || metadata.salaryDay || safeSettings.salaryDay
  );
  const nextCycle = getSalaryCycleDetails(referenceDate, nextSalaryDay);
  const nextArchivedCycles = archiveExists(
    archivedCycles,
    archiveEntry.cycleId
  )
    ? archivedCycles
    : [...archivedCycles, archiveEntry];

  return {
    archivedCycles: nextArchivedCycles,
    openingBalance: metrics.remainingBalance,
    income: 0,
    expenses: [],
    incomeEvents: [],
    cycleMetadata: createCycleMetadata(nextCycle),
    budgetSettings: {
      ...safeSettings,
      salaryDay: nextSalaryDay,
      pendingSalaryDay: null,
      isSetupComplete: true,
    },
    nextCycle,
  };
};
