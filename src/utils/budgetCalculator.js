export const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Bills",
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

export const getExpenseCategory = (item) => {
  if (!isExpense(item)) return null;
  return item.category || UNCATEGORIZED;
};

export const calculateBudgetMetrics = (income, expenses, currentDay, daysInMonth) => {
  const safeDaysInMonth = Math.max(1, Number(daysInMonth) || 1);
  const safeCurrentDay = Math.min(
    Math.max(1, Number(currentDay) || 1),
    safeDaysInMonth
  );
  const monthlyIncome = Number(income) || 0;

  const expenseItems = expenses.filter(isExpense);
  const incomeItems = expenses.filter(item => item.type === "income");

  const totalSpent = sumAmounts(expenseItems);
  const totalSideIncome = sumAmounts(incomeItems);
  const dailyExpenseTotals = buildDailyTotals(expenseItems, safeDaysInMonth);
  const dailyIncomeTotals = buildDailyTotals(incomeItems, safeDaysInMonth);
  const baseDailyBudget = monthlyIncome / safeDaysInMonth;
  const spentToday = dailyExpenseTotals[safeCurrentDay - 1] || 0;
  const sideIncomeToday = dailyIncomeTotals[safeCurrentDay - 1] || 0;
  const remainingBalance = monthlyIncome + totalSideIncome - totalSpent;
  const remainingToday = baseDailyBudget - spentToday;
  const availableToday = baseDailyBudget;

  let previousCarryForward = 0;
  let carryForward = 0;

  for (let dayIndex = 0; dayIndex < safeCurrentDay; dayIndex += 1) {
    if (dayIndex === safeCurrentDay - 1) {
      previousCarryForward = carryForward;
    }

    const dailySavings = baseDailyBudget - (dailyExpenseTotals[dayIndex] || 0);
    carryForward += dailySavings + (dailyIncomeTotals[dayIndex] || 0);
  }

  const maxLimit = remainingToday + carryForward;
  const safeSpendingToday = remainingToday;
  
  return {
    baseDailyBudget: Number(baseDailyBudget) || 0,
    dailyBudget: Number(remainingToday) || 0,
    totalSpent: Number(totalSpent) || 0,
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
