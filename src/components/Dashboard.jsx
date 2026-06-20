import { useState } from "react";
import AnalyticsPanel from "./AnalyticsPanel";
import ExpenseForm from "./ExpenseForm";
import ExpenseHistory from "./ExpenseHistory";
import SummaryCard from "./SummaryCard";
import { calculateBudgetMetrics } from "../utils/budgetCalculator";

const formatCurrency = (value) => {
  const amount = Number(value) || 0;
  const sign = amount < 0 ? "-" : "";

  return `${sign}\u20B9${Math.abs(amount).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};

function getAvailableTone(value, dailyBudget) {
  if (value < 0) return "danger";
  if (value < dailyBudget * 0.5) return "warning";
  return "success";
}

function Dashboard({
  income,
  expenses,
  currentDay,
  daysInMonth,
  monthName,
  year,
  onAddExpense,
  onDeleteExpense,
  onEditIncome,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const metrics = calculateBudgetMetrics(income, expenses, currentDay, daysInMonth);
  const totalFunds = Number(income || 0) + metrics.totalSideIncome;
  const remainingDays = Math.max(1, daysInMonth - currentDay + 1);
  const availableTone = getAvailableTone(metrics.maxLimit, metrics.dailyBudget);
  const carryTone = metrics.carryForward < 0 ? "danger" : metrics.carryForward < metrics.dailyBudget * 0.35 ? "warning" : "success";
  const balanceTone = metrics.remainingBalance < 0 ? "danger" : metrics.remainingBalance < metrics.dailyBudget * remainingDays * 0.5 ? "warning" : "success";

  return (
    <div className="page-enter space-y-6 sm:space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1F2937] dark:bg-[#111827] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-[#94A3B8]">
              Current month
            </p>
            <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-[#F9FAFB] sm:text-3xl">
                {monthName} {year}
              </h2>
              <span className="mb-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-[#1F2937] dark:bg-slate-900/70 dark:text-[#94A3B8]">
                Day {currentDay} of {daysInMonth}
              </span>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-[#94A3B8]">
              Your daily limit is the remaining month balance divided by the days left, then carry forward is added for today.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-[#1F2937] dark:bg-slate-900/70">
              <p className="text-xs font-medium text-slate-500 dark:text-[#94A3B8]">Max limit</p>
              <p className={`mt-1 text-lg font-semibold ${availableTone === "danger" ? "text-[#EF4444]" : availableTone === "warning" ? "text-[#F59E0B]" : "text-[#22C55E]"}`}>
                {formatCurrency(metrics.maxLimit)}
              </p>
            </div>

            <button
              type="button"
              onClick={onEditIncome}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition duration-200 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-[#1F2937] dark:bg-[#111827] dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.8 4.8 2.4 2.4M5 19l4.8-1 9.7-9.7a1.7 1.7 0 0 0 0-2.4l-1.4-1.4a1.7 1.7 0 0 0-2.4 0L6 14.2 5 19Z" />
              </svg>
              Edit income
            </button>
          </div>
        </div>
      </section>

      <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-[#1F2937] dark:bg-[#111827] sm:w-fit" role="tablist" aria-label="Dashboard sections">
        {[
          { id: "overview", label: "Overview" },
          { id: "analytics", label: "Analytics" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition duration-200 sm:flex-none ${
                isActive
                  ? "bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:bg-slate-900/70 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" ? (
        <div className="space-y-6 sm:space-y-8">
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <SummaryCard
              title="Income"
              value={income}
              icon="income"
              subtitle="Monthly planned budget"
              detail={metrics.totalSideIncome > 0 ? `Side income: ${formatCurrency(metrics.totalSideIncome)}` : "Base income for the month"}
            />
            <SummaryCard
              title="Daily Limit"
              value={metrics.dailyBudget}
              icon="limit"
              subtitle="Income minus expenses, divided by days left"
              detail={`${remainingDays} days left including today`}
            />
            <SummaryCard
              title="Max Limit"
              value={metrics.maxLimit}
              icon="available"
              tone={availableTone}
              status={{
                label: availableTone === "danger" ? "Over" : availableTone === "warning" ? "Tight" : "Ready",
                tone: availableTone,
              }}
              subtitle="Daily limit plus carry forward"
              detail={`Carry forward: ${formatCurrency(metrics.carryForward)}`}
            />
            <SummaryCard
              title="Total Spent"
              value={metrics.totalSpent}
              icon="spent"
              tone={metrics.totalSpent > totalFunds ? "danger" : "neutral"}
              status={metrics.totalSpent > totalFunds ? { label: "Over", tone: "danger" } : null}
              subtitle="Expenses logged this month"
              detail="Side income is excluded from spending"
            />
            <SummaryCard
              title="Carry Forward"
              value={metrics.carryForward}
              icon="carry"
              tone={carryTone}
              status={{
                label: metrics.carryForward < 0 ? "Behind" : "Saved",
                tone: carryTone,
              }}
              subtitle="Added to daily limit"
              detail={`Spent today: ${formatCurrency(metrics.spentToday)}`}
            />
            <SummaryCard
              title="Remaining Balance"
              value={metrics.remainingBalance}
              icon="balance"
              tone={balanceTone}
              status={metrics.remainingBalance < 0 ? { label: "Negative", tone: "danger" } : { label: "Healthy", tone: balanceTone }}
              subtitle="Income plus side income minus expenses"
              detail={`${remainingDays} days left including today`}
            />
          </section>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(300px,380px)_1fr]">
            <ExpenseForm onAddExpense={onAddExpense} />
            <ExpenseHistory expenses={expenses} onDeleteExpense={onDeleteExpense} />
          </section>
        </div>
      ) : (
        <AnalyticsPanel
          income={income}
          expenses={expenses}
          currentDay={currentDay}
          daysInMonth={daysInMonth}
          metrics={metrics}
        />
      )}
    </div>
  );
}

export default Dashboard;
