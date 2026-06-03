import { calculateAnalyticsMetrics } from "../utils/budgetCalculator";

const formatCurrency = (value) =>
  `\u20B9${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const categoryColors = [
  "#059669",
  "#2563eb",
  "#d97706",
  "#7c3aed",
  "#dc2626",
  "#0891b2",
  "#4f46e5",
  "#16a34a",
  "#db2777",
  "#64748b",
];

function StatTile({ label, value, detail, tone = "gray" }) {
  const toneClasses = {
    green: "border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
    red: "border-rose-200 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400",
    gray: "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200",
  };

  return (
    <div className={`border rounded-2xl p-4 shadow-sm ${toneClasses[tone] || toneClasses.gray}`}>
      <p className="text-[10px] font-black uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-xl font-black mt-1 break-words">{value}</p>
      {detail && (
        <p className="text-[10px] font-bold mt-2 opacity-75 leading-relaxed">{detail}</p>
      )}
    </div>
  );
}

function getBudgetHealth(metrics, projectedMonthlySpend, income) {
  const projectedLimit = Number(income || 0) + metrics.totalSideIncome;

  if (metrics.remainingBalance < 0) {
    return {
      title: "Over monthly budget",
      detail: `${formatCurrency(Math.abs(metrics.remainingBalance))} beyond available balance.`,
      tone: "red",
    };
  }

  if (metrics.carryForward < 0) {
    return {
      title: "Today is over limit",
      detail: `${formatCurrency(Math.abs(metrics.carryForward))} above today's carry-forward pace.`,
      tone: "red",
    };
  }

  if (projectedMonthlySpend > projectedLimit) {
    return {
      title: "Projection needs attention",
      detail: `${formatCurrency(projectedMonthlySpend - projectedLimit)} above current monthly funds.`,
      tone: "red",
    };
  }

  if (metrics.carryForward > metrics.dailyBudget) {
    return {
      title: "Ahead of pace",
      detail: `${formatCurrency(metrics.carryForward)} carried forward right now.`,
      tone: "green",
    };
  }

  return {
    title: "On track",
    detail: `${formatCurrency(metrics.remainingBalance)} remaining for the month.`,
    tone: "green",
  };
}

function AnalyticsPanel({ income, expenses, currentDay, daysInMonth, metrics }) {
  const analytics = calculateAnalyticsMetrics(expenses, currentDay, daysInMonth);
  const health = getBudgetHealth(metrics, analytics.projectedMonthlySpend, income);
  const maxDailySpend = Math.max(analytics.maxDailySpend, 1);
  const maxCategorySpend = Math.max(
    1,
    ...analytics.categoryBreakdown.map(item => item.amount)
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatTile
          label="Average Daily Spend"
          value={formatCurrency(analytics.averageDailySpend)}
          detail={`${analytics.activeSpendingDays} active spending days`}
        />
        <StatTile
          label="Projected Month"
          value={formatCurrency(analytics.projectedMonthlySpend)}
          detail="Based on current daily average"
          tone={analytics.projectedMonthlySpend > income + metrics.totalSideIncome ? "red" : "green"}
        />
        <StatTile
          label="Best Day"
          value={`Day ${analytics.bestSpendingDay.day}`}
          detail={formatCurrency(analytics.bestSpendingDay.amount)}
        />
        <StatTile
          label="Highest Day"
          value={`Day ${analytics.highestSpendingDay.day}`}
          detail={formatCurrency(analytics.highestSpendingDay.amount)}
          tone={analytics.highestSpendingDay.amount > metrics.dailyBudget ? "red" : "gray"}
        />
      </div>

      <div className={`border rounded-2xl p-4 sm:p-5 shadow-sm ${health.tone === "red"
        ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/30"
        : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/30"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p className={`text-[10px] font-black uppercase tracking-wider ${health.tone === "red"
              ? "text-rose-700 dark:text-rose-400"
              : "text-emerald-700 dark:text-emerald-400"
            }`}>
              Budget Health
            </p>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mt-1">
              {health.title}
            </h3>
          </div>
          <p className="text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-300">
            {health.detail}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        <section className="lg:col-span-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-black text-gray-800 dark:text-white tracking-tight">
                Daily Spending
              </h3>
              <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-bold mt-1">
                Current month by day
              </p>
            </div>
            <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full px-2.5 py-1">
              Max {formatCurrency(analytics.maxDailySpend)}
            </span>
          </div>

          <div className="h-48 flex items-end gap-1 border-b border-gray-100 dark:border-gray-700 pb-2">
            {analytics.dailySpending.map((item) => {
              const height = item.amount > 0 ? Math.max(8, (item.amount / maxDailySpend) * 100) : 2;

              return (
                <div key={item.day} className="flex-1 min-w-0 h-full flex flex-col justify-end items-center gap-1">
                  <div
                    className={`w-full rounded-t-lg transition-all ${item.day <= currentDay
                      ? "bg-emerald-500 dark:bg-emerald-400"
                      : "bg-gray-200 dark:bg-gray-700"
                    }`}
                    style={{ height: `${height}%` }}
                    title={`Day ${item.day}: ${formatCurrency(item.amount)}`}
                  />
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-10 gap-1 mt-2">
            {analytics.dailySpending
              .filter(item => item.day === 1 || item.day === daysInMonth || item.day % 5 === 0)
              .map((item) => (
                <span key={item.day} className="text-[9px] text-gray-400 dark:text-gray-500 font-bold">
                  {item.day}
                </span>
              ))}
          </div>
        </section>

        <section className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-black text-gray-800 dark:text-white tracking-tight">
                Categories
              </h3>
              <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-bold mt-1">
                Expenses only
              </p>
            </div>
            <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full px-2.5 py-1">
              {analytics.categoryBreakdown.length}
            </span>
          </div>

          {analytics.categoryBreakdown.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-bold text-gray-400 dark:text-gray-500">
                No expense categories yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.categoryBreakdown.map((item, index) => (
                <div key={item.category}>
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <span className="text-xs font-black text-gray-700 dark:text-gray-200 truncate">
                      {item.category}
                    </span>
                    <span className="text-xs font-black text-gray-500 dark:text-gray-400">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(4, (item.amount / maxCategorySpend) * 100)}%`,
                        backgroundColor: categoryColors[index % categoryColors.length],
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-1">
                    {item.percent.toFixed(1)}% of spending
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default AnalyticsPanel;
