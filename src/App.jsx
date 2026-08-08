import { useEffect, useRef, useState } from "react";
import BrandLogo from "./components/BrandLogo";
import Dashboard from "./components/Dashboard";
import IncomeForm from "./components/IncomeForm";
import { useLocalStorage } from "./hooks/useLocalStorage";
import {
  DEFAULT_BUDGET_SETTINGS,
  createCycleMetadata,
  createCycleRolloverPlan,
  createSalaryDayChangePlan,
  normalizeBudgetSettings,
  normalizeLegacyIncomeEvents,
} from "./utils/cycleManager";
import {
  getCycleDetailsFromMetadata,
  getDaysInMonth,
  getLocalDateKey,
  getSalaryCycleDetails,
  sanitizeSalaryDay,
} from "./utils/dateUtils";

const formatCurrency = (value) => {
  const amount = Number(value) || 0;
  const sign = amount < 0 ? "-" : "";

  return `${sign}\u20B9${Math.abs(amount).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};

const readStoredJson = (key, fallback) => {
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : fallback;
  } catch {
    return fallback;
  }
};

const hasLegacyFinancialData = () => {
  const savedIncome = Number(readStoredJson("income", 0)) || 0;
  const savedOpeningBalance =
    Number(readStoredJson("openingBalance", 0)) || 0;
  const savedExpenses = readStoredJson("expenses", []);
  const savedIncomeEvents = readStoredJson("incomeEvents", []);
  const savedArchives = readStoredJson("archivedMonths", []);

  return Boolean(
    savedIncome ||
      savedOpeningBalance ||
      savedExpenses.length ||
      savedIncomeEvents.length ||
      savedArchives.length
  );
};

const getInitialBudgetSettings = () => ({
  ...DEFAULT_BUDGET_SETTINGS,
  isSetupComplete: hasLegacyFinancialData(),
});

const getInitialArchivedCycles = () => {
  const legacyArchives = readStoredJson("archivedMonths", []);

  return legacyArchives.map((archive, index) => {
    if (archive.cycleStart && archive.cycleEnd) return archive;

    const year = Number(archive.year);
    const month = Number(archive.month);

    if (!Number.isInteger(year) || !Number.isInteger(month)) {
      return {
        ...archive,
        cycleId: archive.cycleId || `legacy-${index}`,
      };
    }

    const cycleStart = getLocalDateKey(new Date(year, month, 1));
    const cycleEnd = getLocalDateKey(
      new Date(year, month, getDaysInMonth(year, month))
    );

    return {
      ...archive,
      version: 2,
      cycleId: cycleStart,
      cycleStart,
      cycleEnd,
      salaryDay: 1,
    };
  });
};

function App() {
  const [income, setIncome] = useLocalStorage("income", 0);
  const [incomeEvents, setIncomeEvents] = useLocalStorage("incomeEvents", []);
  const [openingBalance, setOpeningBalance] = useLocalStorage(
    "openingBalance",
    0
  );
  const [expenses, setExpenses] = useLocalStorage("expenses", []);
  const [budgetSettings, setBudgetSettings] = useLocalStorage(
    "budgetSettings:v2",
    getInitialBudgetSettings
  );
  const [cycleMetadata, setCycleMetadata] = useLocalStorage(
    "cycleMetadata:v2",
    null
  );
  const [archivedCycles, setArchivedCycles] = useLocalStorage(
    "archivedCycles:v2",
    getInitialArchivedCycles
  );
  const [isDarkMode, setIsDarkMode] = useLocalStorage("darkMode", true);

  const [showCycleChangePrompt, setShowCycleChangePrompt] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [incomeMode, setIncomeMode] = useState("add");
  const [resetVersion, setResetVersion] = useState(0);
  const [todayKey, setTodayKey] = useState(() =>
    getLocalDateKey(new Date())
  );
  const initializationStartedRef = useRef(false);
  const rolloverCycleIdRef = useRef(null);
  const resetDialogRef = useRef(null);
  const cycleDialogRef = useRef(null);
  const dialogOpenerRef = useRef(null);

  const settings = normalizeBudgetSettings(budgetSettings);
  const fallbackCycle = getSalaryCycleDetails(
    todayKey,
    cycleMetadata?.salaryDay || settings.salaryDay
  );
  const activeCycle =
    getCycleDetailsFromMetadata(cycleMetadata, todayKey) || fallbackCycle;
  const isSetupComplete = settings.isSetupComplete;
  const activeFormMode = isSetupComplete ? incomeMode : "setup";
  const shouldShowIncomeForm = !isSetupComplete || showIncomeForm;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    let midnightTimerId;

    const refreshToday = () => {
      const nextTodayKey = getLocalDateKey(new Date());
      setTodayKey((currentKey) =>
        currentKey === nextTodayKey ? currentKey : nextTodayKey
      );
    };

    const scheduleMidnightRefresh = () => {
      const now = new Date();
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        1
      );

      window.clearTimeout(midnightTimerId);
      midnightTimerId = window.setTimeout(() => {
        refreshToday();
        scheduleMidnightRefresh();
      }, nextMidnight.getTime() - now.getTime());
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshToday();
    };

    window.addEventListener("focus", refreshToday);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    scheduleMidnightRefresh();

    return () => {
      window.clearTimeout(midnightTimerId);
      window.removeEventListener("focus", refreshToday);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (cycleMetadata || initializationStartedRef.current) return;

    initializationStartedRef.current = true;
    const initialSettings = normalizeBudgetSettings(settings);
    const legacyMonthMetadata = readStoredJson("monthMetadata", null);
    const legacyMonth = Number(legacyMonthMetadata?.month);
    const hasLegacyCycle =
      initialSettings.isSetupComplete &&
      Number.isInteger(Number(legacyMonthMetadata?.year)) &&
      Number.isInteger(legacyMonth) &&
      legacyMonth >= 0 &&
      legacyMonth <= 11;
    const cycleReferenceDate = hasLegacyCycle
      ? new Date(
          Number(legacyMonthMetadata.year),
          legacyMonth,
          1
        )
      : todayKey;
    const initialCycle = getSalaryCycleDetails(
      cycleReferenceDate,
      initialSettings.salaryDay
    );
    const migratedIncomeEvents = normalizeLegacyIncomeEvents({
      income,
      incomeEvents,
      cycle: initialCycle,
    });

    setCycleMetadata(createCycleMetadata(initialCycle));
    setIncomeEvents(migratedIncomeEvents);
    setBudgetSettings({
      ...initialSettings,
      isSetupComplete:
        initialSettings.isSetupComplete || hasLegacyFinancialData(),
    });
    setArchivedCycles((currentArchives) => currentArchives);
  }, [
    archivedCycles,
    cycleMetadata,
    income,
    incomeEvents,
    setArchivedCycles,
    setBudgetSettings,
    setCycleMetadata,
    setIncomeEvents,
    settings,
    todayKey,
  ]);

  useEffect(() => {
    if (!cycleMetadata) return;

    const rolloverPlan = createCycleRolloverPlan({
      referenceDate: todayKey,
      metadata: cycleMetadata,
      settings,
      income,
      openingBalance,
      expenses,
      incomeEvents,
      archivedCycles,
    });

    if (
      !rolloverPlan ||
      rolloverCycleIdRef.current === cycleMetadata.cycleId
    ) {
      return;
    }

    rolloverCycleIdRef.current = cycleMetadata.cycleId;
    setArchivedCycles(rolloverPlan.archivedCycles);
    setOpeningBalance(rolloverPlan.openingBalance);
    setIncome(rolloverPlan.income);
    setExpenses(rolloverPlan.expenses);
    setIncomeEvents(rolloverPlan.incomeEvents);
    setCycleMetadata(rolloverPlan.cycleMetadata);
    setBudgetSettings(rolloverPlan.budgetSettings);
    setShowIncomeForm(false);
    dialogOpenerRef.current = document.activeElement;
    setShowCycleChangePrompt(true);
  }, [
    archivedCycles,
    cycleMetadata,
    expenses,
    income,
    incomeEvents,
    openingBalance,
    setArchivedCycles,
    setBudgetSettings,
    setCycleMetadata,
    setExpenses,
    setIncome,
    setIncomeEvents,
    setOpeningBalance,
    settings,
    todayKey,
  ]);

  useEffect(() => {
    if (!showResetConfirm && !showCycleChangePrompt) return undefined;

    const dialog = showResetConfirm
      ? resetDialogRef.current
      : cycleDialogRef.current;
    const focusableElements = dialog
      ? [...dialog.querySelectorAll("button, input, select, textarea, [tabindex]:not([tabindex='-1'])")]
      : [];
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (dialog && !dialog.contains(document.activeElement)) {
      firstFocusable?.focus();
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (showResetConfirm) setShowResetConfirm(false);
        else setShowCycleChangePrompt(false);
        return;
      }

      if (event.key !== "Tab" || focusableElements.length === 0) return;

      if (event.shiftKey && document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      } else if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (dialogOpenerRef.current?.isConnected) {
        dialogOpenerRef.current.focus();
      }
    };
  }, [showCycleChangePrompt, showResetConfirm]);

  const handleAddExpense = (newExpense) => {
    setExpenses((currentExpenses) => [...currentExpenses, newExpense]);
  };

  const handleDeleteExpense = (id) => {
    setExpenses((currentExpenses) =>
      currentExpenses.filter((expense) => expense.id !== id)
    );
  };

  const handleDeleteIncomeEvent = (id) => {
    const eventToDelete = incomeEvents.find((event) => event.id === id);
    if (!eventToDelete) return;

    setIncomeEvents((currentEvents) =>
      currentEvents.filter((event) => event.id !== id)
    );
    setIncome((currentIncome) =>
      Math.max(
        0,
        (Number(currentIncome) || 0) - (Number(eventToDelete.amount) || 0)
      )
    );
  };

  const saveSalaryDaySetting = (salaryDay) => {
    const changePlan = createSalaryDayChangePlan({
      referenceDate: todayKey,
      metadata: cycleMetadata || createCycleMetadata(activeCycle),
      settings,
      selectedSalaryDay: salaryDay,
    });

    if (!changePlan) return;

    setCycleMetadata(changePlan.cycleMetadata);
    setBudgetSettings(changePlan.budgetSettings);
  };

  const handleIncomeSubmit = ({ amount, receivedOn, salaryDay }) => {
    if (activeFormMode === "settings") {
      saveSalaryDaySetting(salaryDay);
    } else {
      const salaryEvent = {
        id: Date.now(),
        amount: Number(amount) || 0,
        type: "salary",
        receivedOn,
        createdAt: new Date().toISOString(),
      };

      if (activeFormMode === "setup") {
        const selectedSalaryDay = sanitizeSalaryDay(salaryDay);
        const setupCycle = getSalaryCycleDetails(todayKey, selectedSalaryDay);

        setIncome(Number(amount) || 0);
        setIncomeEvents([salaryEvent]);
        setCycleMetadata(createCycleMetadata(setupCycle));
        setBudgetSettings({
          ...settings,
          salaryDay: selectedSalaryDay,
          pendingSalaryDay: null,
          isSetupComplete: true,
        });
      } else {
        setIncome(
          (currentIncome) => (Number(currentIncome) || 0) + salaryEvent.amount
        );
        setIncomeEvents((currentEvents) => [
          ...currentEvents,
          salaryEvent,
        ]);
      }
    }

    setShowIncomeForm(false);
    setIncomeMode("add");
  };

  const openIncomeForm = (mode) => {
    setIncomeMode(mode);
    setShowCycleChangePrompt(false);
    setShowIncomeForm(true);
  };

  const handleResetAllData = () => {
    const defaultCycle = getSalaryCycleDetails(todayKey, 1);

    setIncome(0);
    setOpeningBalance(0);
    setExpenses([]);
    setIncomeEvents([]);
    setBudgetSettings(DEFAULT_BUDGET_SETTINGS);
    setCycleMetadata(createCycleMetadata(defaultCycle));
    setArchivedCycles([]);
    setShowIncomeForm(false);
    setIncomeMode("add");
    setShowCycleChangePrompt(false);
    setShowResetConfirm(false);
    setResetVersion((version) => version + 1);
    rolloverCycleIdRef.current = null;

    localStorage.removeItem("monthMetadata");
    localStorage.removeItem("archivedMonths");
  };

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
              onClick={(event) => {
                dialogOpenerRef.current = event.currentTarget;
                setShowResetConfirm(true);
              }}
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
              onClick={() => setIsDarkMode((currentMode) => !currentMode)}
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
                    <path d="M12 17.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11ZM12 2a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0v-1A.75.75 0 0 1 12 2ZM12 20.25a.75.75 0 0 1 .75.75v.25a.75.75 0 0 1-1.5 0V21a.75.75 0 0 1 .75-.75ZM21.25 12a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1 0-1.5h.75a.75.75 0 0 1 .75.75ZM4.25 12a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1 0-1.5h.75a.75.75 0 0 1 .75-.75Z" />
                  </svg>
                )}
              </span>
              <span className="hidden sm:inline">{isDarkMode ? "Dark" : "Light"}</span>
            </button>
          </div>
        </header>

        <main className="flex-1">
          {shouldShowIncomeForm ? (
            <div className="page-enter">
              {isSetupComplete && (
                <div className="mx-auto mb-4 flex max-w-md justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowIncomeForm(false);
                      setIncomeMode("add");
                    }}
                    className="rounded-full px-3 py-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:text-[#94A3B8] dark:hover:text-white"
                  >
                    Back to dashboard
                  </button>
                </div>
              )}
              <IncomeForm
                key={`${resetVersion}-${activeFormMode}-${activeCycle.id}-${settings.pendingSalaryDay || "none"}`}
                onSubmit={handleIncomeSubmit}
                activeCycle={activeCycle}
                initialValue={activeFormMode === "setup" && income > 0 ? income : ""}
                initialSalaryDay={
                  settings.pendingSalaryDay ||
                  cycleMetadata?.salaryDay ||
                  settings.salaryDay
                }
                initialReceivedOn={
                  activeFormMode === "add" ? todayKey : activeCycle.startKey
                }
                mode={activeFormMode}
              />
            </div>
          ) : (
            <Dashboard
              income={income}
              openingBalance={openingBalance}
              expenses={expenses}
              incomeEvents={incomeEvents}
              cycle={activeCycle}
              pendingSalaryDay={settings.pendingSalaryDay}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              onDeleteIncomeEvent={handleDeleteIncomeEvent}
              onRecordSalary={() => openIncomeForm("add")}
              onOpenSettings={() => openIncomeForm("settings")}
            />
          )}
        </main>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div
            ref={resetDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-dialog-title"
            className="page-enter w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-[#1F2937] dark:bg-[#111827] sm:p-7"
          >
            <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl border border-red-200 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4M12 17h.01M10.3 4.6 2.9 17.4A2 2 0 0 0 4.6 20h14.8a2 2 0 0 0 1.7-2.6L13.7 4.6a2 2 0 0 0-3.4 0Z" />
              </svg>
            </div>

            <h2 id="reset-dialog-title" className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Reset all data?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-[#94A3B8]">
              This clears your salary, salary-day setting, opening balance,
              transactions, and archived cycles. This action cannot be undone.
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
                autoFocus
                onClick={() => setShowResetConfirm(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-[#1F2937] dark:bg-[#111827] dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showCycleChangePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div
            ref={cycleDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cycle-dialog-title"
            className="page-enter w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-[#1F2937] dark:bg-[#111827] sm:p-7"
          >
            <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v4M16 2v4M3 10h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
              </svg>
            </div>

            <h2 id="cycle-dialog-title" className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
              New salary cycle
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-[#94A3B8]">
              {activeCycle.label} has started. Your previous remaining balance was
              carried forward. Record salary now if you received it, or continue
              and add it later.
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
                autoFocus
                onClick={() => openIncomeForm("add")}
                className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                Record salary
              </button>
              <button
                type="button"
                onClick={() => setShowCycleChangePrompt(false)}
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
