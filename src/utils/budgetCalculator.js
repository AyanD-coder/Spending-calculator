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

const getDayOfMonth = (isoString) => {
  const date = new Date(isoString);
  const day = date.getDate();

  return Number.isFinite(day) ? day : null;
};

const buildDailyTotals = (items, daysInMonth) => {
  const totals = Array.from({ length: daysInMonth }, () => 0);

  items.forEach((item) => {
    const day = getDayOfMonth(item.createdAt);

    if (day && day >= 1 && day <= daysInMonth) {
      totals[day - 1] += Number(item.amount) || 0;
    }
  });

  return totals;
};

const buildDailyBudgets = (baseFunds, incomeEvents, daysInMonth) => {
  const safeDaysInMonth = Math.max(1, Number(daysInMonth) || 1);
  const budgets = Array.from(
    { length: safeDaysInMonth },
    () => (Number(baseFunds) || 0) / safeDaysInMonth
  );

  incomeEvents.forEach((event) => {
    const amount = Number(event.amount) || 0;
    const day = getDayOfMonth(event.createdAt);

    if (!amount || !day || day < 1 || day > safeDaysInMonth) {
      return;
    }

    const remainingDays = safeDaysInMonth - day + 1;
    const dailyAddition = amount / remainingDays;

    for (let index = day - 1; index < safeDaysInMonth; index += 1) {
      budgets[index] += dailyAddition;
    }
  });

  return budgets;
};

export const getExpenseCategory = (item) => {
  if (!isExpense(item)) return null;
  return item.category || UNCATEGORIZED;
};

export const calculateBudgetMetrics = (income, expenses, currentDay, daysInMonth, openingBalance = 0, incomeEvents = []) => {
  const safeDaysInMonth = Math.max(1, Number(daysInMonth) || 1);
  const safeCurrentDay = Math.min(
    Math.max(1, Number(currentDay) || 1),
    safeDaysInMonth
  );
  const monthlyIncome = Number(income) || 0;
  const startingBalance = Number(openingBalance) || 0;
  const grossMonthlyFunds = startingBalance + monthlyIncome;

  const expenseItems = expenses.filter(isExpense);
  const fixedExpenseItems = expenses.filter(isFixedExpense);
  const incomeItems = expenses.filter(isIncome);
  const validIncomeEvents = incomeEvents.filter((event) => Number(event.amount) > 0);

  const totalSpent = sumAmounts(expenseItems);
  const totalFixedExpenses = sumAmounts(fixedExpenseItems);
  const totalExpenses = totalSpent + totalFixedExpenses;
  const totalSideIncome = sumAmounts(incomeItems);
  const totalAddedIncome = sumAmounts(validIncomeEvents);
  const baseMonthlyIncome = monthlyIncome - totalAddedIncome;
  const baseMonthlyFunds = startingBalance + baseMonthlyIncome;
  const monthlyFunds = grossMonthlyFunds;
  const incomeBudgetEvents = [...validIncomeEvents, ...incomeItems];
  const dailyBudgetTotals = buildDailyBudgets(baseMonthlyFunds, incomeBudgetEvents, safeDaysInMonth);
  const dailyExpenseTotals = buildDailyTotals(expenseItems, safeDaysInMonth);
  const dailyFixedExpenseTotals = buildDailyTotals(fixedExpenseItems, safeDaysInMonth);
  const dailyIncomeTotals = buildDailyTotals(incomeItems, safeDaysInMonth);
  const baseDailyBudget = dailyBudgetTotals[safeCurrentDay - 1] || 0;
  const spentToday = dailyExpenseTotals[safeCurrentDay - 1] || 0;
  const sideIncomeToday = dailyIncomeTotals[safeCurrentDay - 1] || 0;
  const remainingBalance = grossMonthlyFunds + totalSideIncome - totalExpenses;
  const remainingToday = baseDailyBudget - spentToday;
  const availableToday = baseDailyBudget;

  let previousCarryForward = 0;
  let carryForward = 0;

  for (let dayIndex = 0; dayIndex < safeCurrentDay; dayIndex += 1) {
    if (dayIndex === safeCurrentDay - 1) {
      previousCarryForward = carryForward;
    }

    const dailySavings = (dailyBudgetTotals[dayIndex] || 0) - (dailyExpenseTotals[dayIndex] || 0);
    carryForward += dailySavings - (dailyFixedExpenseTotals[dayIndex] || 0);
  }

  const maxLimit = remainingToday + carryForward;
  const safeSpendingToday = remainingToday;
  
  return {
    openingBalance: Number(startingBalance) || 0,
    monthlyIncome: Number(monthlyIncome) || 0,
    baseMonthlyIncome: Number(baseMonthlyIncome) || 0,
    totalAddedIncome: Number(totalAddedIncome) || 0,
    grossMonthlyFunds: Number(grossMonthlyFunds) || 0,
    monthlyFunds: Number(monthlyFunds) || 0,
    totalAvailableFunds: Number(monthlyFunds + totalSideIncome) || 0,
    baseDailyBudget: Number(baseDailyBudget) || 0,
    dailyBudget: Number(remainingToday) || 0,
    totalSpent: Number(totalSpent) || 0,
    totalFixedExpenses: Number(totalFixedExpenses) || 0,
    totalExpenses: Number(totalExpenses) || 0,
    totalSideIncome: Number(totalSideIncome) || 0,
    spentToday: Number(spentToday) || 0,
    sideIncomeToday: Number(sideIncomeToday) || 0,
    previousCarryForward: Number(previousCarryForward) || 0,
    carryForward: Number(carryForward) || 0,
    remainingToday: Number(remainingToday) || 0,
    maxLimit: Number(maxLimit) || 0,
    remainingBalance: Number(remainingBalance) || 0,
    savings: Number(carryForward) || 0,
    availableToday: Number(availableToday) || 0,
    safeSpendingToday: Number(safeSpendingToday) || 0,
  };
};

export const calculateAnalyticsMetrics = (expenses, currentDay, daysInMonth) => {
  const safeDaysInMonth = Math.max(1, Number(daysInMonth) || 1);
  const safeCurrentDay = Math.min(
    Math.max(1, Number(currentDay) || 1),
    safeDaysInMonth
  );
  const expenseItems = expenses.filter(isExpense);
  const totalSpent = sumAmounts(expenseItems);

  const dailySpending = Array.from({ length: safeDaysInMonth }, (_, index) => ({
    day: index + 1,
    amount: 0,
  }));

  const categoryTotals = expenseItems.reduce((totals, item) => {
    const category = getExpenseCategory(item);
    totals[category] = (totals[category] || 0) + (Number(item.amount) || 0);
    return totals;
  }, {});

  expenseItems.forEach((item) => {
    const day = getDayOfMonth(item.createdAt);

    if (day && day >= 1 && day <= safeDaysInMonth) {
      dailySpending[day - 1].amount += Number(item.amount) || 0;
    }
  });

  const elapsedDailySpending = dailySpending.slice(0, safeCurrentDay);
  const averageDailySpend = totalSpent / safeCurrentDay;
  const projectedMonthlySpend = averageDailySpend * safeDaysInMonth;
  const maxDailySpend = Math.max(0, ...dailySpending.map(item => item.amount));
  const activeSpendingDays = elapsedDailySpending.filter(item => item.amount > 0).length;

  const highestSpendingDay = elapsedDailySpending.reduce(
    (highest, item) => item.amount > highest.amount ? item : highest,
    { day: 1, amount: 0 }
  );
  const bestSpendingDay = elapsedDailySpending.reduce(
    (best, item) => item.amount < best.amount ? item : best,
    { day: 1, amount: elapsedDailySpending[0]?.amount || 0 }
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
    projectedMonthlySpend: Number(projectedMonthlySpend) || 0,
    highestSpendingDay,
    bestSpendingDay,
    maxDailySpend,
    activeSpendingDays,
  };
};
