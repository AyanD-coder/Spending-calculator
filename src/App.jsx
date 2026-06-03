import { useState, useEffect } from "react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import IncomeForm from "./components/IncomeForm";
import Dashboard from "./components/Dashboard";
import { getCurrentDateDetails } from "./utils/dateUtils";

function App() {
  const [income, setIncome] = useLocalStorage("income", 0);
  const [expenses, setExpenses] = useLocalStorage("expenses", []);
  const [, setMonthMetadata] = useLocalStorage("monthMetadata", null);
  const [, setArchivedMonths] = useLocalStorage("archivedMonths", []);
  
  const [showMonthChangePrompt, setShowMonthChangePrompt] = useState(false);
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [isDarkMode, setIsDarkMode] = useLocalStorage("darkMode", false);

  // Apply dark mode to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const { year, month, day, daysInMonth } = getCurrentDateDetails();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthName = monthNames[month];

  // Month detection on load
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
          // Archive previous month's data
          const savedExpenses = JSON.parse(localStorage.getItem("expenses") || "[]");
          const savedIncome = Number(JSON.parse(localStorage.getItem("income") || "0"));
          
          const totalSpent = savedExpenses
            .filter(item => !item.type || item.type === "expense")
            .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
          const totalSideIncome = savedExpenses
            .filter(item => item.type === "income")
            .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
          const archiveEntry = {
            month: parsedMeta.month,
            year: parsedMeta.year,
            income: savedIncome,
            totalSpent,
            totalSideIncome,
            remainingBalance: savedIncome + totalSideIncome - totalSpent,
            expenses: savedExpenses,
            archivedAt: new Date().toISOString()
          };
          
          const savedArchives = JSON.parse(localStorage.getItem("archivedMonths") || "[]");
          localStorage.setItem("archivedMonths", JSON.stringify([...savedArchives, archiveEntry]));
          setArchivedMonths([...savedArchives, archiveEntry]);
          
          // Reset current expenses for new month
          localStorage.setItem("expenses", JSON.stringify([]));
          setExpenses([]);
          
          // Update month metadata
          const newMeta = { month: currentMonth, year: currentYear };
          localStorage.setItem("monthMetadata", JSON.stringify(newMeta));
          setMonthMetadata(newMeta);
          
          promptTimerId = window.setTimeout(() => {
            setShowMonthChangePrompt(true);
          }, 0);
        }
      } catch (e) {
        console.error("Error during month change transition:", e);
      }
    } else {
      // First run: save metadata
      const newMeta = { month: currentMonth, year: currentYear };
      localStorage.setItem("monthMetadata", JSON.stringify(newMeta));
      setMonthMetadata(newMeta);
    }

    return () => {
      if (promptTimerId) {
        window.clearTimeout(promptTimerId);
      }
    };
  }, [setArchivedMonths, setExpenses, setMonthMetadata]);

  const handleAddExpense = (newExpense) => {
    setExpenses([...expenses, newExpense]);
  };

  const handleDeleteExpense = (id) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  const handleIncomeSubmit = (newIncome) => {
    setIncome(newIncome);
    setIsEditingIncome(false);
  };

  const handleKeepSameIncome = () => {
    setShowMonthChangePrompt(false);
  };

  const handleResetIncome = () => {
    setIncome(0);
    setShowMonthChangePrompt(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {/* App Title and Dark Mode Toggle */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                <span className="p-2 bg-gray-700 dark:bg-gray-800 text-gray-100 dark:text-gray-300 rounded-2xl shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18a2.25 2.25 0 0 1-2.25 2.25h-6A2.25 2.25 0 0 1 5.25 18v-8.25A2.25 2.25 0 0 1 7.5 7.5h6a2.25 2.25 0 0 1 2.25 2.25v1.5m3 0 3-3m0 0-3-3m3 3H9" />
                  </svg>
                </span>
                <span className="hidden sm:inline">Spending Calculator</span>
                <span className="sm:hidden">Spending</span>
              </h1>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-2">Carry-Forward Daily Budgeting</p>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-white px-2 py-1.5 text-xs font-extrabold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:focus:ring-offset-gray-900"
              aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
              aria-pressed={isDarkMode}
              title={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
            >
              <span className={`relative flex h-7 w-12 items-center rounded-full p-1 transition-colors ${
                isDarkMode ? "bg-gray-950" : "bg-amber-100"
              }`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-200 ${
                  isDarkMode ? "translate-x-5 text-gray-700" : "translate-x-0 text-amber-500"
                }`}>
                  {isDarkMode ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="h-3.5 w-3.5">
                      <path d="M21 14.35A8.5 8.5 0 0 1 9.65 3a7 7 0 1 0 11.35 11.35Z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="h-3.5 w-3.5">
                      <path d="M12 17.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11ZM12 1.75a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0v-1A.75.75 0 0 1 12 1.75ZM12 19.75a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0v-1a.75.75 0 0 1 .75-.75ZM22.25 12a.75.75 0 0 1-.75.75h-1a.75.75 0 0 1 0-1.5h1a.75.75 0 0 1 .75.75ZM4.25 12a.75.75 0 0 1-.75.75h-1a.75.75 0 0 1 0-1.5h1a.75.75 0 0 1 .75.75ZM19.25 4.75a.75.75 0 0 1 0 1.06l-.7.7a.75.75 0 0 1-1.06-1.06l.7-.7a.75.75 0 0 1 1.06 0ZM6.51 17.49a.75.75 0 0 1 0 1.06l-.7.7a.75.75 0 0 1-1.06-1.06l.7-.7a.75.75 0 0 1 1.06 0ZM19.25 19.25a.75.75 0 0 1-1.06 0l-.7-.7a.75.75 0 0 1 1.06-1.06l.7.7a.75.75 0 0 1 0 1.06ZM6.51 6.51a.75.75 0 0 1-1.06 0l-.7-.7a.75.75 0 0 1 1.06-1.06l.7.7a.75.75 0 0 1 0 1.06Z" />
                    </svg>
                  )}
                </span>
              </span>
              <span className="hidden sm:flex flex-col items-start leading-none">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Theme
                </span>
                <span className="mt-1 text-xs text-gray-700 dark:text-gray-200">
                  {isDarkMode ? "Dark" : "Light"}
                </span>
              </span>
            </button>
          </div>
        </header>

        {/* Content Views */}
        <main>
          {income === 0 || isEditingIncome ? (
            <div className="space-y-4">
              {isEditingIncome && (
                <div className="max-w-md mx-auto flex justify-end">
                  <button
                    onClick={() => setIsEditingIncome(false)}
                    className="text-xs font-bold text-gray-500 hover:text-gray-600 transition-colors uppercase tracking-wider"
                  >
                    ← Cancel and Back
                  </button>
                </div>
              )}
              <IncomeForm
                setIncome={handleIncomeSubmit}
                initialValue={income > 0 ? income : ""}
              />
            </div>
          ) : (
            <Dashboard
              income={income}
              expenses={expenses}
              currentDay={day}
              daysInMonth={daysInMonth}
              monthName={monthName}
              year={year}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              onEditIncome={() => setIsEditingIncome(true)}
            />
          )}
        </main>
      </div>

      {/* Month Change Alert Modal */}
      {showMonthChangePrompt && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 dark:bg-gray-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="h-14 w-14 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6 border border-emerald-200 dark:border-emerald-900/30 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white text-center tracking-tight">
              Welcome to {monthName}!
            </h3>
            
            <p className="text-sm text-gray-400 dark:text-gray-400 mt-2 text-center font-medium">
              We detected a new month has started. Your previous month's expenses have been archived successfully.
            </p>

            <div className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-4 rounded-2xl my-6 flex flex-col items-center">
              <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">Last Month's Income</span>
              <span className="text-2xl font-black text-gray-700 dark:text-gray-100 mt-1">₹{income.toLocaleString('en-IN')}</span>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center font-bold mb-6">
              Would you like to keep using this same income for {monthName}?
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleKeepSameIncome}
                className="w-full bg-gray-700 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white font-extrabold py-3.5 rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 text-sm"
              >
                Yes, Use Same Income
              </button>
              <button
                onClick={handleResetIncome}
                className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-extrabold py-3.5 rounded-2xl transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm"
              >
                No, Change Income
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
