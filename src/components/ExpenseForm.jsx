import { useState } from "react";
import { EXPENSE_CATEGORIES } from "../utils/budgetCalculator";

function ExpenseForm({ onAddExpense }) {
  const [type, setType] = useState("expense"); // "expense" | "income"
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = Number(amount);
    
    if (!amount || isNaN(parsedAmount)) {
      setError("Please enter a valid amount.");
      return;
    }
    if (parsedAmount <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }
    
    setError("");
    onAddExpense({
      id: Date.now(),
      amount: parsedAmount,
      type, // "expense" or "income"
      category: type === "expense" ? category : null,
      description: description.trim() || (type === "expense" ? "Expense" : "Side Income"),
      createdAt: new Date().toISOString(),
    });
    
    setAmount("");
    setDescription("");
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-md">
      {/* Transaction Type Tabs */}
      <div className="flex bg-gray-100 dark:bg-gray-900 p-1.5 rounded-2xl mb-5 sm:mb-6">
        <button
          type="button"
          onClick={() => {
            setType("expense");
            setError("");
          }}
          className={`flex-1 py-2 text-xs sm:text-xs font-extrabold rounded-xl transition-all uppercase tracking-wider ${
            type === "expense"
              ? "bg-white dark:bg-gray-800 text-rose-600 dark:text-rose-400 shadow-sm"
              : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => {
            setType("income");
            setError("");
          }}
          className={`flex-1 py-2 text-xs sm:text-xs font-extrabold rounded-xl transition-all uppercase tracking-wider ${
            type === "income"
              ? "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
          }`}
        >
          Side Income
        </button>
      </div>

      <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight mb-4 flex items-center gap-2">
        {type === "expense" ? (
          <>
            <span className="p-1.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-lg flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 sm:w-4.5 sm:h-4.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </span>
            <span className="truncate">Add Expense</span>
          </>
        ) : (
          <>
            <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 sm:w-4.5 sm:h-4.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </span>
            <span className="truncate">Add Side Income</span>
          </>
        )}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <div>
          <label htmlFor="expense-amount" className="block text-[10px] sm:text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
            Amount (₹) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-extrabold text-sm">₹</span>
            <input
              id="expense-amount"
              type="number"
              min="0.01"
              step="any"
              placeholder="0.00"
              className={`w-full pl-8 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-gray-800 transition-all font-bold text-gray-700 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 text-sm ${
                type === "expense" ? "focus:ring-rose-500" : "focus:ring-emerald-500"
              }`}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (error) setError("");
              }}
            />
          </div>
          {error && (
            <p className="text-xs text-rose-500 dark:text-rose-400 font-bold mt-1.5 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 flex-shrink-0">
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          )}
        </div>

        {type === "expense" && (
          <div>
            <label htmlFor="expense-category" className="block text-[10px] sm:text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              id="expense-category"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white dark:focus:bg-gray-800 transition-all font-bold text-gray-700 dark:text-gray-200 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {EXPENSE_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="expense-desc" className="block text-[10px] sm:text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
            Description
          </label>
          <input
            id="expense-desc"
            type="text"
            placeholder={type === "expense" ? "e.g. Lunch, Coffee, Rent" : "e.g. Freelance, Refund, Gift"}
            className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-gray-800 transition-all font-medium text-gray-700 dark:text-gray-300 placeholder-gray-300 dark:placeholder-gray-600 text-sm ${
              type === "expense" ? "focus:ring-rose-500" : "focus:ring-emerald-500"
            }`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className={`w-full text-white font-extrabold py-2.5 sm:py-3 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 text-xs sm:text-sm ${
            type === "expense"
              ? "bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600"
              : "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
          }`}
        >
          <span>{type === "expense" ? "Log Expense" : "Log Side Income"}</span>
        </button>
      </form>
    </div>
  );
}

export default ExpenseForm;
