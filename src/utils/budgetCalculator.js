import { addDaysToDateKey, getCycleDayIndex } from "./dateUtils.js";

export const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Bills",
  "Recharge",
  "Shopping",
  "Health",
  "Entertainment",
  "Education",
  "Travel",
  "Personal",
  "Other",
];

export const UNCATEGORIZED = "Uncategorized";

const sumAmounts = (items) =>
  items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

const isExpense = (item) => !item.type || item.type === "expense";
const isFixedExpense = (item) => item.type === "fixedExpense";
const isIncome = (item) => item.type === "income";

const getItemDate = (item) =>
  item?.receivedOn || item?.occurredOn || item?.createdAt;

const getItemCycleIndex = (item, cycle) =>
  getCycleDayIndex(getItemDate(item), cycle);

const getItemsInCycle = (items, cycle) =>
  items.filter((item) => getItemCycleIndex(item, cycle) !== null);

const buildDailyTotals = (items, cycle) => {
  const totals = Array.from({ length: cycle.totalDays }, () => 0);

  items.forEach((item) => {
    const dayIndex = getItemCycleIndex(item, cycle);

    if (dayIndex !== null) {
      totals[dayIndex] += Number(item.amount) || 0;
    }
  });

  return totals;
};

const buildDailyBudgets = (baseFunds, incomeEvents, cycle) => {
  const budgets = Array.from(
    { length: cycle.totalDays },
    () => (Number(baseFunds) || 0) / cycle.totalDays
  );

  incomeEvents.forEach((event) => {
    const amount = Number(event.amount) || 0;
    const dayIndex = getItemCycleIndex(event, cycle);

    if (!amount || dayIndex === null) return;

    const remainingDays = cycle.totalDays - dayIndex;
    const dailyAddition = amount / remainingDays;

    for (let index = dayIndex; index < cycle.totalDays; index += 1) {
      budgets[index] += dailyAddition;
    }
  });

  return budgets;
};

const normalizeCycle = (cycle) => {
  const totalDays = Math.max(
    1,
    Number(cycle?.totalDays || cycle?.daysInCycle) || 1
  );
  const currentDay = Math.min(
    Math.max(1, Number(cycle?.currentDay) || 1),
    totalDays
  );

  return {
    ...cycle,
    startKey: cycle?.startKey || cycle?.cycleStart,
    endKey: cycle?.endKey || cycle?.cycleEnd,
    totalDays,
    daysInCycle: totalDays,
    currentDay,
    remainingDays: Math.max(1, totalDays - currentDay + 1),
  };
};

export const getExpenseCategory = (item) => {
  if (!isExpense(item)) return null;
  return item.category || UNCATEGORIZED;
};

export const calculateBudgetMetrics = ({
  income = 0,
  expenses = [],
  cycle,
  openingBalance = 0,
  incomeEvents = [],
}) => {
  const safeCycle = normalizeCycle(cycle);
  const currentDayIndex = safeCycle.currentDay - 1;
  const recordedIncome = Number(income) || 0;
  const startingBalance = Number(openingBalance) || 0;
  const allValidIncomeEvents = incomeEvents.filter(
    (event) => Number(event.amount) > 0
  );
  const validIncomeEvents = getItemsInCycle(allValidIncomeEvents, safeCycle);
  const totalDatedIncome = sumAmounts(allValidIncomeEvents);
  const baseCycleIncome = recordedIncome - totalDatedIncome;
  const receivedSalary = sumAmounts(validIncomeEvents);
  const cycleIncome = baseCycleIncome + receivedSalary;

  const cycleTransactions = getItemsInCycle(expenses, safeCycle);
  const expenseItems = cycleTransactions.filter(isExpense);
  const fixedExpenseItems = cycleTransactions.filter(isFixedExpense);
  const incomeItems = cycleTransactions.filter(isIncome);

  const totalSpent = sumAmounts(expenseItems);
  const totalFixedExpenses = sumAmounts(fixedExpenseItems);
  const totalExpenses = totalSpent + totalFixedExpenses;
  const totalSideIncome = sumAmounts(incomeItems);
  const baseCycleFunds = startingBalance + baseCycleIncome;
  const cycleFunds = startingBalance + cycleIncome;
  const incomeBudgetEvents = [...validIncomeEvents, ...incomeItems];
  const dailyBudgetTotals = buildDailyBudgets(
    baseCycleFunds,
    incomeBudgetEvents,
    safeCycle
  );
  const dailyExpenseTotals = buildDailyTotals(expenseItems, safeCycle);
  const dailyFixedExpenseTotals = buildDailyTotals(
    fixedExpenseItems,
    safeCycle
  );
  const dailyIncomeTotals = buildDailyTotals(incomeItems, safeCycle);
  const baseDailyBudget = dailyBudgetTotals[currentDayIndex] || 0;
  const spentToday = dailyExpenseTotals[currentDayIndex] || 0;
  const fixedExpensesToday = dailyFixedExpenseTotals[currentDayIndex] || 0;
  const sideIncomeToday = dailyIncomeTotals[currentDayIndex] || 0;
  const remainingBalance =
    cycleFunds + totalSideIncome - totalExpenses;
  const remainingToday = baseDailyBudget - spentToday;
  const availableToday = baseDailyBudget;

  let previousCarryForward = 0;
  let carryForward = 0;

  for (let dayIndex = 0; dayIndex <= currentDayIndex; dayIndex += 1) {
    if (dayIndex === currentDayIndex) {
      previousCarryForward = carryForward;
    }

    carryForward +=
      (dailyBudgetTotals[dayIndex] || 0) -
      (dailyExpenseTotals[dayIndex] || 0) -
      (dailyFixedExpenseTotals[dayIndex] || 0);
  }

  const maxLimit = carryForward;

  return {
    openingBalance: Number(startingBalance) || 0,
    cycleIncome: Number(cycleIncome) || 0,
    baseCycleIncome: Number(baseCycleIncome) || 0,
    receivedSalary: Number(receivedSalary) || 0,
    cycleFunds: Number(cycleFunds) || 0,
    totalAvailableFunds: Number(cycleFunds + totalSideIncome) || 0,
    dailyBudgetTotals,
    baseDailyBudget: Number(baseDailyBudget) || 0,
    dailyBudget: Number(remainingToday) || 0,
    totalSpent: Number(totalSpent) || 0,
    totalFixedExpenses: Number(totalFixedExpenses) || 0,
    totalExpenses: Number(totalExpenses) || 0,
    totalSideIncome: Number(totalSideIncome) || 0,
    spentToday: Number(spentToday) || 0,
    fixedExpensesToday: Number(fixedExpensesToday) || 0,
    sideIncomeToday: Number(sideIncomeToday) || 0,
    previousCarryForward: Number(previousCarryForward) || 0,
    carryForward: Number(carryForward) || 0,
    remainingToday: Number(remainingToday) || 0,
    maxLimit: Number(maxLimit) || 0,
    remainingBalance: Number(remainingBalance) || 0,
    savings: Number(carryForward) || 0,
    availableToday: Number(availableToday) || 0,
    safeSpendingToday: Math.max(0, Number(maxLimit) || 0),

    // Backward-compatible metric names for archived data and older UI consumers.
    monthlyIncome: Number(cycleIncome) || 0,
    baseMonthlyIncome: Number(baseCycleIncome) || 0,
    totalAddedIncome: Number(receivedSalary) || 0,
    grossMonthlyFunds: Number(cycleFunds) || 0,
    monthlyFunds: Number(cycleFunds) || 0,
  };
};

export const calculateAnalyticsMetrics = ({ expenses = [], cycle }) => {
  const safeCycle = normalizeCycle(cycle);
  const expenseItems = getItemsInCycle(expenses, safeCycle).filter(isExpense);
  const totalSpent = sumAmounts(expenseItems);
  const dailySpending = Array.from(
    { length: safeCycle.totalDays },
    (_, index) => ({
      day: index + 1,
      dateKey: addDaysToDateKey(safeCycle.startKey, index),
      amount: 0,
    })
  );

  const categoryTotals = expenseItems.reduce((totals, item) => {
    const category = getExpenseCategory(item);
    totals[category] = (totals[category] || 0) + (Number(item.amount) || 0);
    return totals;
  }, {});

  expenseItems.forEach((item) => {
    const dayIndex = getItemCycleIndex(item, safeCycle);

    if (dayIndex !== null) {
      dailySpending[dayIndex].amount += Number(item.amount) || 0;
    }
  });

  const elapsedDailySpending = dailySpending.slice(0, safeCycle.currentDay);
  const averageDailySpend = totalSpent / safeCycle.currentDay;
  const projectedCycleSpend = averageDailySpend * safeCycle.totalDays;
  const maxDailySpend = Math.max(
    0,
    ...dailySpending.map((item) => item.amount)
  );
  const activeSpendingDays = elapsedDailySpending.filter(
    (item) => item.amount > 0
  ).length;
  const highestSpendingDay = elapsedDailySpending.reduce(
    (highest, item) => (item.amount > highest.amount ? item : highest),
    { day: 1, dateKey: safeCycle.startKey, amount: 0 }
  );
  const bestSpendingDay = elapsedDailySpending.reduce(
    (best, item) => (item.amount < best.amount ? item : best),
    {
      day: 1,
      dateKey: safeCycle.startKey,
      amount: elapsedDailySpending[0]?.amount || 0,
    }
  );
  const categoryBreakdown = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percent: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    dailySpending,
    categoryBreakdown,
    totalSpent: Number(totalSpent) || 0,
    averageDailySpend: Number(averageDailySpend) || 0,
    projectedCycleSpend: Number(projectedCycleSpend) || 0,
    projectedMonthlySpend: Number(projectedCycleSpend) || 0,
    highestSpendingDay,
    bestSpendingDay,
    maxDailySpend,
    activeSpendingDays,
  };
};
