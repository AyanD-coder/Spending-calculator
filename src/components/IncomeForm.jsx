import { useState } from "react";

function IncomeForm({ setIncome, initialValue = "" }) {
  const [inputIncome, setInputIncome] = useState(initialValue);
  const [error, setError] = useState("");

  const handleSave = (e) => {
    e.preventDefault();
    const parsed = Number(inputIncome);
    if (!inputIncome || isNaN(parsed)) {
      setError("Please enter a valid monthly income.");
      return;
    }
    if (parsed <= 0) {
      setError("Income must be a positive number greater than zero.");
      return;
    }
    setError("");
    setIncome(parsed);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="flex flex-col items-center mb-6 sm:mb-8">
        <div className="h-12 sm:h-14 w-12 sm:w-14 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full flex items-center justify-center mb-4 border border-gray-200 dark:border-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 sm:w-7 sm:h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight text-center">Set Your Budget</h2>
        <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-2 text-center font-medium leading-relaxed">Enter your monthly income to automatically calculate your daily carry-forward budget.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4 sm:space-y-5">
        <div>
          <label htmlFor="income-input" className="block text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
            Monthly Income (₹)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-extrabold text-lg">₹</span>
            <input
              id="income-input"
              type="number"
              min="1"
              placeholder="e.g. 30000"
              className="w-full pl-10 pr-4 py-3.5 sm:py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:bg-white dark:focus:bg-gray-800 transition-all font-bold text-gray-700 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 text-sm sm:text-base"
              value={inputIncome}
              onChange={(e) => {
                setInputIncome(e.target.value);
                if (error) setError("");
              }}
            />
          </div>
          {error && (
            <p className="text-xs text-rose-500 dark:text-rose-400 font-bold mt-2 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-gray-700 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white font-extrabold py-3.5 sm:py-4 rounded-2xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <span>Get Started</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </form>
    </div>
  );
}

export default IncomeForm;
