import { useEffect, useState } from "react";
import BrandLogo from "./components/BrandLogo";
import Dashboard from "./components/Dashboard";
import IncomeForm from "./components/IncomeForm";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { getCurrentDateDetails } from "./utils/dateUtils";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const formatCurrency = (value) => {
  const amount = Number(value) || 0;
  const sign = amount < 0 ? "-" : "";

  return `${sign}\u20B9${Math.abs(amount).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};

function App() {
  const [income, setIncome] = useLocalStorage("income", 0);
  const [incomeEvents, setIncomeEvents] = useLocalStorage("incomeEvents", []);
  const [openingBalance, setOpeningBalance] = useLocalStorage("openingBalance", 0);
  const [expenses, setExpenses] = useLocalStorage("expenses", []);
  const [, setMonthMetadata] = useLocalStorage("monthMetadata", null);
  const [, setArchivedMonths] = useLocalStorage("archivedMonths", []);

  const [showMonthChangePrompt, setShowMonthChangePrompt] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [incomeMode, setIncomeMode] = useState("replace");
  const [resetVersion, setResetVersion] = useState(0);
  const [isDarkMode, setIsDarkMode] = useLocalStorage("darkMode", true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  const { year, month, day, daysInMonth } = getCurrentDateDetails();
  const monthName = monthNames[month];

  useEffect(() => {
    let promptTimerId;
    const savedMeta = localStorage.getItem("monthMetadata");
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    if (savedMeta) {
      try {
        const parsedMeta = JSON.parse(savedMeta);

        if (parsedMeta.month !== currentMonth || parsedMeta.year !== currentYear) {
          const savedExpenses = JSON.parse(localStorage.getItem("expenses") || "[]");
          const savedIncomeEvents = JSON.parse(localStorage.getItem("incomeEvents") || "[]");
          const savedIncome = Number(JSON.parse(localStorage.getItem("income") || "0"));
          const savedOpeningBalance = Number(JSON.parse(localStorage.getItem("openingBalance") || "0"));
          const totalSpent = savedExpenses
            .filter((item) => !item.type || item.type === "expense")
            .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
          const totalFixedExpenses = savedExpenses
            .filter((item) => item.type === "fixedExpense")
            .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
          const totalExpenses = totalSpent + totalFixedExpenses;
          const totalSideIncome = savedExpenses
            .filter((item) => item.type === "income")
            .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
          const remainingBalance = savedOpeningBalance + savedIncome + totalSideIncome - totalExpenses;
          const archiveEntry = {
            month: parsedMeta.month,
            year: parsedMeta.year,
            openingBalance: savedOpeningBalance,
            income: savedIncome,
            totalSpent,
            totalFixedExpenses,
            totalExpenses,
            totalSideIncome,
            remainingBalance,
            expenses: savedExpenses,
            incomeEvents: savedIncomeEvents,
            archivedAt: new Date().toISOString(),
          };
          const savedArchives = JSON.parse(localStorage.getItem("archivedMonths") || "[]");
          const nextArchives = [...savedArchives, archiveEntry];
          const newMeta = { month: currentMonth, year: currentYear };

          localStorage.setItem("archivedMonths", JSON.stringify(nextArchives));
          localStorage.setItem("expenses", JSON.stringify([]));
          localStorage.setItem("incomeEvents", JSON.stringify([]));
          localStorage.setItem("openingBalance", JSON.stringify(remainingBalance));
          localStorage.setItem("income", JSON.stringify(0));
          localStorage.setItem("monthMetadata", JSON.stringify(newMeta));

          setArchivedMonths(nextArchives);
          setExpenses([]);
          setIncomeEvents([]);
          setOpeningBalance(remainingBalance);
          setIncome(0);
          setMonthMetadata(newMeta);

          promptTimerId = window.setTimeout(() => {
            setShowMonthChangePrompt(true);
          }, 0);
        }
      } catch (error) {
        console.error("Error during month change transition:", error);
      }
    } else {
      const newMeta = { month: currentMonth, year: currentYear };
      localStorage.setItem("monthMetadata", JSON.stringify(newMeta));
      setMonthMetadata(newMeta);
    }

    return () => {
      if (promptTimerId) {
        window.clearTimeout(promptTimerId);
      }
    };
  }, [setArchivedMonths, setExpenses, setIncome, setIncomeEvents, setMonthMetadata, setOpeningBalance]);

  const handleAddExpense = (newExpense) => {
    setExpenses([...expenses, newExpense]);
  };

  const handleDeleteExpense = (id) => {
    setExpenses(expenses.filter((expense) => expense.id !== id));
  };

  const handleIncomeSubmit = (newIncome) => {
    if (incomeMode === "add") {
      const incomeAmount = Number(newIncome) || 0;

      setIncome((Number(income) || 0) + incomeAmount);
      setIncomeEvents([
        ...incomeEvents,
        {
          id: Date.now(),
          amount: incomeAmount,
          createdAt: new Date().toISOString(),
        },
      ]);
    } else {
      setIncome(newIncome);
      setIncomeEvents([]);
    }

    setIsEditingIncome(false);
    setIncomeMode("replace");
  };

  const handleContinueWithCarryForward = () => {
    setShowMonthChangePrompt(false);
  };

  const openIncomeForm = (mode) => {
    setIncomeMode(mode);
    setShowMonthChangePrompt(false);
    setIsEditingIncome(true);
  };

  const handleAddSalary = () => {
    openIncomeForm("add");
  };

  const handleResetAllData = () => {
    const newMeta = { month, year };

    setIncome(0);
    setOpeningBalance(0);
    setExpenses([]);
    setIncomeEvents([]);
    setMonthMetadata(newMeta);
    setArchivedMonths([]);
    setIsEditingIncome(false);
    setIncomeMode("replace");
    setShowMonthChangePrompt(false);
    setShowResetConfirm(false);
    setResetVersion((version) => version + 1);
  };

  const hasMonthlyFunds = Number(income || 0) !== 0 || Number(openingBalance || 0) !== 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 transition-colors duration-200 dark:bg-[#0B1220] dark:text-[#F9FAFB]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo className="h-14 w-16 flex-shrink-0 sm:h-16 sm:w-20" />
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-[#94A3B8]">
                Spending Calculator
              </p>
              <h1 className="truncate text-xl font-semibold tracking-tight text-slate-950 dark:text-[#F9FAFB] sm:text-2xl">
                Daily budget dashboard
              </h1>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-red-200 bg-white px-2.5 text-sm font-semibold text-red-600 shadow-sm transition duration-200 hover:border-red-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 focus:ring-offset-slate-50 dark:border-red-900/50 dark:bg-[#111827] dark:text-red-300 dark:hover:border-red-800 dark:hover:bg-red-950/30 dark:focus:ring-red-900/60 dark:focus:ring-offset-[#0B1220]"
              aria-label="Reset all spending data"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 6h14M9 6V4h6v2M8 10v8M16 10v8M7 6l1 14h8l1-14" />
                </svg>
              </span>
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-700 shadow-sm transition duration-200 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 dark:border-[#1F2937] dark:bg-[#111827] dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:focus:ring-slate-500 dark:focus:ring-offset-[#0B1220]"
              aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
              aria-pressed={isDarkMode}
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {isDarkMode ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                    <path d="M21 14.35A8.5 8.5 0 0 1 9.65 3a7 7 0 1 0 11.35 11.35Z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                    <path d="M12 17.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11ZM12 2a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0v-1A.75.75 0 0 1 12 2ZM12 20.25a.75.75 0 0 1 .75.75v.25a.75.75 0 0 1-1.5 0V21a.75.75 0 0 1 .75-.75ZM21.25 12a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1 0-1.5h.75a.75.75 0 0 1 .75.75ZM4.25 12a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1 0-1.5h.75a.75.75 0 0 1 .75.75Z" />
                  </svg>
                )}
              </span>
              <span className="hidden sm:inline">{isDarkMode ? "Dark" : "Light"}</span>
            </button>
          </div>
        </header>

        <main className="flex-1">
          {!hasMonthlyFunds || isEditingIncome ? (
            <div className="page-enter">
              {isEditingIncome && (
                <div className="mx-auto mb-4 flex max-w-md justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingIncome(false);
                      setIncomeMode("replace");
                    }}
                    className="rounded-full px-3 py-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:text-[#94A3B8] dark:hover:text-white"
                  >
                    Back to dashboard
                  </button>
                </div>
              )}
              <IncomeForm
                key={`${resetVersion}-${incomeMode}`}
                setIncome={handleIncomeSubmit}
                initialValue={incomeMode === "add" ? "" : income > 0 ? income : ""}
                mode={incomeMode}
                submitLabel={incomeMode === "add" ? "Add income" : isEditingIncome ? "Save salary" : "Continue"}
              />
            </div>
          ) : (
            <Dashboard
              income={income}
              openingBalance={openingBalance}
              expenses={expenses}
              incomeEvents={incomeEvents}
              currentDay={day}
              daysInMonth={daysInMonth}
              monthName={monthName}
              year={year}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              onAddSalary={handleAddSalary}
              onEditIncome={() => openIncomeForm("replace")}
            />
          )}
        </main>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="page-enter w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-[#1F2937] dark:bg-[#111827] sm:p-7">
            <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl border border-red-200 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4M12 17h.01M10.3 4.6 2.9 17.4A2 2 0 0 0 4.6 20h14.8a2 2 0 0 0 1.7-2.6L13.7 4.6a2 2 0 0 0-3.4 0Z" />
              </svg>
            </div>

            <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Reset all data?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-[#94A3B8]">
              This clears your salary, opening balance, transactions, and archived months. This action cannot be undone.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleResetAllData}
                className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                Reset data
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-[#1F2937] dark:bg-[#111827] dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showMonthChangePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="page-enter w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-[#1F2937] dark:bg-[#111827] sm:p-7">
            <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v4M16 2v4M3 10h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
              </svg>
            </div>

            <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Welcome to {monthName}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-[#94A3B8]">
              Your previous month's remaining balance was carried forward. Add income now if you received it, or continue and add it later.
            </p>

            <div className="my-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-[#1F2937] dark:bg-slate-900/60">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-[#94A3B8]">
                Opening balance
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">
                {formatCurrency(openingBalance)}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleAddSalary}
                className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                Add income
              </button>
              <button
                type="button"
                onClick={handleContinueWithCarryForward}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-[#1F2937] dark:bg-[#111827] dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
