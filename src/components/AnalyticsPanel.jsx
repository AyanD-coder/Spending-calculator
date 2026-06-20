import { calculateAnalyticsMetrics } from "../utils/budgetCalculator";

const formatCurrency = (value) => {
  const amount = Number(value) || 0;
  const sign = amount < 0 ? "-" : "";

  return `${sign}\u20B9${Math.abs(amount).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};

const categoryColors = [
  "#22C55E",
  "#38BDF8",
  "#F59E0B",
  "#A78BFA",
  "#EF4444",
  "#14B8A6",
  "#818CF8",
  "#84CC16",
  "#F472B6",
  "#94A3B8",
];

function getBudgetHealth(metrics, projectedMonthlySpend, income) {
  const projectedLimit = Number(income || 0) + metrics.totalSideIncome;

  if (metrics.remainingBalance < 0) {
    return {
      title: "Over monthly budget",
      detail: `${formatCurrency(Math.abs(metrics.remainingBalance))} beyond your available balance.`,
      tone: "danger",
    };
  }

  if (metrics.carryForward < 0) {
    return {
      title: "Today is above pace",
      detail: `${formatCurrency(Math.abs(metrics.carryForward))} over today's max limit.`,
      tone: "danger",
    };
  }

  if (projectedMonthlySpend > projectedLimit) {
    return {
      title: "Projection needs attention",
      detail: `${formatCurrency(projectedMonthlySpend - projectedLimit)} above current monthly funds.`,
      tone: "warning",
    };
  }

  if (metrics.carryForward > metrics.dailyBudget) {
    return {
      title: "Ahead of pace",
      detail: `${formatCurrency(metrics.carryForward)} left after today's spending.`,
      tone: "success",
    };
  }

  return {
    title: "On track",
    detail: `${formatCurrency(metrics.remainingBalance)} remaining for the month.`,
    tone: "success",
  };
}

function MetricCard({ label, value, caption, tone = "neutral" }) {
  const toneClass = {
    neutral: "text-slate-950 dark:text-white",
    success: "text-[#16A34A] dark:text-[#22C55E]",
    warning: "text-[#D97706] dark:text-[#F59E0B]",
    danger: "text-[#DC2626] dark:text-[#EF4444]",
  }[tone];

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1F2937] dark:bg-[#111827]">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-[#94A3B8]">
        {label}
      </p>
      <p className={`mt-3 text-2xl font-semibold tracking-tight ${toneClass}`}>
        {value}
      </p>
      {caption && (
        <p className="mt-2 text-sm leading-5 text-slate-500 dark:text-[#94A3B8]">
          {caption}
        </p>
      )}
    </article>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="grid h-full min-h-[220px] place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center dark:border-[#1F2937] dark:bg-slate-900/40">
      <div>
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-white text-slate-400 shadow-sm dark:bg-[#111827] dark:text-slate-500">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 19V5M5 19h14M8 15l3-3 3 2 4-6" />
          </svg>
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
          {title}
        </p>
        <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500 dark:text-[#94A3B8]">
          {description}
        </p>
      </div>
    </div>
  );
}

function createLinePath(points) {
  if (points.length === 0) return "";

  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
}

function buildPoints(values, maxValue, width = 640, height = 240) {
  const padding = { top: 18, right: 18, bottom: 30, left: 38 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const safeMax = Math.max(maxValue, 1);
  const count = Math.max(values.length - 1, 1);

  return values.map((value, index) => ({
    x: padding.left + (index / count) * innerWidth,
    y: padding.top + innerHeight - (Number(value || 0) / safeMax) * innerHeight,
  }));
}

function ChartFrame({ title, eyebrow, action, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1F2937] dark:bg-[#111827] sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-[#94A3B8]">
            {eyebrow}
          </p>
          <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
            {title}
          </h3>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function SpendingTrendChart({ dailySpending, currentDay, hasExpenses }) {
  const visibleDays = dailySpending.slice(0, currentDay);
  const values = visibleDays.map((item) => item.amount);
  const maxValue = Math.max(1, ...values);
  const points = buildPoints(values, maxValue);
  const linePath = createLinePath(points);
  const gridLines = [0.25, 0.5, 0.75, 1];

  if (!hasExpenses) {
    return (
      <EmptyState
        title="No spending trend yet"
        description="Log a few expenses and the daily trend will appear here."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-[#1F2937] dark:bg-slate-900/40">
      <svg viewBox="0 0 640 240" role="img" aria-label="Daily spending trend line chart" className="h-[260px] w-full">
        {gridLines.map((line) => {
          const y = 18 + (1 - line) * 192;

          return (
            <line
              key={line}
              x1="38"
              x2="622"
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeDasharray="4 6"
              className="text-slate-200 dark:text-[#1F2937]"
            />
          );
        })}
        <path d={linePath} fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => (
          values[index] > 0 && (
            <circle
              key={`${point.x}-${point.y}`}
              cx={point.x}
              cy={point.y}
              r="3.5"
              fill="#22C55E"
              stroke="currentColor"
              strokeWidth="2"
              className="text-white dark:text-[#111827]"
            >
              <title>
                Day {visibleDays[index].day}: {formatCurrency(visibleDays[index].amount)}
              </title>
            </circle>
          )
        ))}
        <text x="38" y="228" className="fill-slate-400 text-[11px] font-semibold dark:fill-slate-500">
          Day 1
        </text>
        <text x="584" y="228" className="fill-slate-400 text-[11px] font-semibold dark:fill-slate-500">
          Today
        </text>
      </svg>
    </div>
  );
}

function MonthlyPaceChart({ dailySpending, totalFunds, hasExpenses }) {
  const cumulativeSpend = dailySpending.reduce((totals, item) => {
    const previousTotal = totals[totals.length - 1] || 0;
    return [...totals, previousTotal + Number(item.amount || 0)];
  }, []);
  const budgetPace = dailySpending.map((item) => (Number(totalFunds || 0) / dailySpending.length) * item.day);
  const maxValue = Math.max(1, Number(totalFunds || 0), ...cumulativeSpend, ...budgetPace);
  const spendPath = createLinePath(buildPoints(cumulativeSpend, maxValue));
  const budgetPath = createLinePath(buildPoints(budgetPace, maxValue));
  const latestSpend = cumulativeSpend[cumulativeSpend.length - 1] || 0;

  if (!hasExpenses) {
    return (
      <EmptyState
        title="Monthly pace is empty"
        description="After you add expenses, this chart compares actual spending with your budget pace."
      />
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-[#1F2937] dark:bg-slate-900/40">
      <div className="flex flex-wrap items-center gap-4 border-b border-slate-200 px-4 py-3 text-xs font-semibold text-slate-500 dark:border-[#1F2937] dark:text-[#94A3B8]">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
          Actual {formatCurrency(latestSpend)}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-slate-400" />
          Budget pace {formatCurrency(totalFunds)}
        </span>
      </div>
      <svg viewBox="0 0 640 240" role="img" aria-label="Monthly spending compared with budget pace" className="h-[260px] w-full">
        {[0.25, 0.5, 0.75, 1].map((line) => {
          const y = 18 + (1 - line) * 192;

          return (
            <line
              key={line}
              x1="38"
              x2="622"
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeDasharray="4 6"
              className="text-slate-200 dark:text-[#1F2937]"
            />
          );
        })}
        <path d={budgetPath} fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={spendPath} fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <text x="38" y="228" className="fill-slate-400 text-[11px] font-semibold dark:fill-slate-500">
          Day 1
        </text>
        <text x="570" y="228" className="fill-slate-400 text-[11px] font-semibold dark:fill-slate-500">
          Month end
        </text>
      </svg>
    </div>
  );
}

function CategoryBreakdown({ items, totalSpent }) {
  const maxSpend = Math.max(1, ...items.map((item) => item.amount));

  if (items.length === 0) {
    return (
      <EmptyState
        title="No category data"
        description="Expense categories will show here once spending is logged."
      />
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={item.category}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: categoryColors[index % categoryColors.length] }}
              />
              <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                {item.category}
              </span>
            </div>
            <span className="text-sm font-semibold text-slate-950 dark:text-white">
              {formatCurrency(item.amount)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.max(3, (item.amount / maxSpend) * 100)}%`,
                backgroundColor: categoryColors[index % categoryColors.length],
              }}
            />
          </div>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-[#94A3B8]">
            {totalSpent > 0 ? item.percent.toFixed(1) : "0.0"}% of spending
          </p>
        </div>
      ))}
    </div>
  );
}

function AnalyticsPanel({ income, expenses, currentDay, daysInMonth, metrics }) {
  const analytics = calculateAnalyticsMetrics(expenses, currentDay, daysInMonth);
  const hasExpenses = analytics.totalSpent > 0;
  const totalFunds = Number(income || 0) + metrics.totalSideIncome;
  const health = getBudgetHealth(metrics, analytics.projectedMonthlySpend, income);
  const projectedTone = analytics.projectedMonthlySpend > totalFunds ? "danger" : "success";
  const highestTone = analytics.highestSpendingDay.amount > metrics.dailyBudget ? "warning" : "neutral";
  const healthToneClasses = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300",
    warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300",
    danger: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300",
  };

  return (
    <div className="page-enter space-y-6 sm:space-y-8">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Average daily spend"
          value={formatCurrency(analytics.averageDailySpend)}
          caption={`${analytics.activeSpendingDays} active spending day${analytics.activeSpendingDays === 1 ? "" : "s"}`}
        />
        <MetricCard
          label="Projected month"
          value={formatCurrency(analytics.projectedMonthlySpend)}
          caption="Based on elapsed days"
          tone={projectedTone}
        />
        <MetricCard
          label="Best day"
          value={hasExpenses ? `Day ${analytics.bestSpendingDay.day}` : "No spend"}
          caption={hasExpenses ? formatCurrency(analytics.bestSpendingDay.amount) : "No expense logged yet"}
        />
        <MetricCard
          label="Highest day"
          value={hasExpenses ? `Day ${analytics.highestSpendingDay.day}` : "No spend"}
          caption={hasExpenses ? formatCurrency(analytics.highestSpendingDay.amount) : "No expense logged yet"}
          tone={highestTone}
        />
      </section>

      <section className={`rounded-2xl border p-5 shadow-sm sm:p-6 ${healthToneClasses[health.tone]}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-80">
              Budget health
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
              {health.title}
            </h3>
          </div>
          <p className="max-w-xl text-sm font-medium leading-6 text-slate-700 dark:text-slate-200">
            {health.detail}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ChartFrame
          eyebrow="Trend"
          title="Daily spending"
          action={
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500 dark:border-[#1F2937] dark:bg-slate-900/70 dark:text-[#94A3B8]">
              Max {formatCurrency(analytics.maxDailySpend)}
            </span>
          }
        >
          <SpendingTrendChart
            dailySpending={analytics.dailySpending}
            currentDay={currentDay}
            hasExpenses={hasExpenses}
          />
        </ChartFrame>

        <ChartFrame
          eyebrow="Overview"
          title="Monthly pace"
          action={
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500 dark:border-[#1F2937] dark:bg-slate-900/70 dark:text-[#94A3B8]">
              {daysInMonth} days
            </span>
          }
        >
          <MonthlyPaceChart
            dailySpending={analytics.dailySpending}
            totalFunds={totalFunds}
            hasExpenses={hasExpenses}
          />
        </ChartFrame>
      </section>

      <ChartFrame
        eyebrow="Breakdown"
        title="Spending by category"
        action={
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500 dark:border-[#1F2937] dark:bg-slate-900/70 dark:text-[#94A3B8]">
            Expenses only
          </span>
        }
      >
        <CategoryBreakdown items={analytics.categoryBreakdown} totalSpent={analytics.totalSpent} />
      </ChartFrame>
    </div>
  );
}

export default AnalyticsPanel;
