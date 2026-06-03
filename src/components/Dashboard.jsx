import { useState } from "react";
import SummaryCard from "./SummaryCard";
import ExpenseForm from "./ExpenseForm";
import ExpenseHistory from "./ExpenseHistory";
import AnalyticsPanel from "./AnalyticsPanel";
import { calculateBudgetMetrics } from "../utils/budgetCalculator";

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-black text-gray-800 dark:text-white tracking-tight">
            Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 font-semibold mt-0.5">
            {monthName} {year} • Day {currentDay} of {daysInMonth}
          </p>
        </div>
        <button
          onClick={onEditIncome}
          className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-extrabold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center gap-1.5 whitespace-nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
          Edit Income
        </button>
      </div>

      <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700 w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex-1 sm:flex-none px-4 py-2 text-xs font-black rounded-xl transition-all uppercase tracking-wider ${
            activeTab === "overview"
              ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm"
              : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`flex-1 sm:flex-none px-4 py-2 text-xs font-black rounded-xl transition-all uppercase tracking-wider ${
            activeTab === "analytics"
              ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm"
              : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          }`}
        >
          Analytics
        </button>
      </div>

      {activeTab === "overview" ? (
        <>
          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <SummaryCard
              title="Income"
              value={income}
              type="gray"
              subtitle="Monthly planned budget"
            />
            <SummaryCard
              title="Daily Limit"
              value={metrics.dailyBudget}
              type="gray"
              subtitle="Income divided by days"
            />
            <SummaryCard
              title="Available Today"
              value={metrics.availableToday}
              type={metrics.availableToday >= 0 ? "green" : "red"}
              subtitle="Daily limit + previous carry forward"
            />
            <SummaryCard
              title="Spent Today"
              value={metrics.spentToday}
              type={metrics.spentToday > metrics.availableToday ? "red" : "gray"}
              subtitle="Expenses logged today"
            />
            <SummaryCard
              title="Carry Forward"
              value={metrics.carryForward}
              type={metrics.carryForward >= 0 ? "green" : "red"}
              subtitle="Final day value is savings"
            />
            <SummaryCard
              title="Remaining Balance"
              value={metrics.remainingBalance}
              type={metrics.remainingBalance >= 0 ? "green" : "red"}
              subtitle="Income + side income - total spent"
            />
            <SummaryCard
              title="Total Spent"
              value={metrics.totalSpent}
              type={metrics.totalSpent > income ? "red" : "gray"}
              subtitle="Expenses logged this month"
            />
          </div>

          {/* Forms & History Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-6">
            <div className="md:col-span-2">
              <ExpenseForm onAddExpense={onAddExpense} />
            </div>
            <div className="md:col-span-3">
              <ExpenseHistory
                expenses={expenses}
                onDeleteExpense={onDeleteExpense}
              />
            </div>
          </div>
        </>
      ) : (
        <div>
          <AnalyticsPanel
            income={income}
            expenses={expenses}
            currentDay={currentDay}
            daysInMonth={daysInMonth}
            metrics={metrics}
          />
        </div>
      )}
    </div>
  );
}

export default Dashboard;
