import { useState } from "react";
import { EXPENSE_CATEGORIES } from "../utils/budgetCalculator";

function ExpenseForm({ onAddExpense }) {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const parsedAmount = Number(amount);

    if (!amount || Number.isNaN(parsedAmount)) {
      setError("Enter a valid amount.");
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
      type,
      category: type === "expense" ? category : null,
      description: description.trim() || (type === "expense" ? "Expense" : "Side income"),
      createdAt: new Date().toISOString(),
    });

    setAmount("");
    setDescription("");
  };

  const isExpense = type === "expense";

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1F2937] dark:bg-[#111827] sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-[#94A3B8]">
            Quick entry
          </p>
          <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
            Add transaction
          </h3>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-900/70 dark:text-[#94A3B8]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-[#1F2937] dark:bg-slate-900/70" aria-label="Transaction type">
        {[
          { id: "expense", label: "Expense" },
          { id: "income", label: "Side income" },
        ].map((option) => {
          const selected = type === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setType(option.id);
                setError("");
              }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition duration-200 ${
                selected
                  ? "bg-white text-slate-950 shadow-sm dark:bg-[#111827] dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-white"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="expense-amount" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Amount
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 dark:text-slate-500">
              {"\u20B9"}
            </span>
            <input
              id="expense-amount"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="any"
              placeholder="0.00"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-sm font-semibold text-slate-950 transition duration-200 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-[#1F2937] dark:bg-slate-900/70 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-slate-600 dark:focus:ring-slate-800"
              value={amount}
              aria-invalid={Boolean(error)}
              onChange={(event) => {
                setAmount(event.target.value);
                if (error) setError("");
              }}
            />
          </div>
          {error && (
            <p className="mt-2 text-sm font-medium text-[#EF4444]">
              {error}
            </p>
          )}
        </div>

        {isExpense && (
          <div>
            <label htmlFor="expense-category" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Category
            </label>
            <select
              id="expense-category"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-950 transition duration-200 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-[#1F2937] dark:bg-slate-900/70 dark:text-white dark:focus:border-slate-600 dark:focus:ring-slate-800"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
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
          <label htmlFor="expense-desc" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Notes
          </label>
          <input
            id="expense-desc"
            type="text"
            placeholder={isExpense ? "Lunch, groceries, rent" : "Freelance, refund, gift"}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-950 transition duration-200 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-[#1F2937] dark:bg-slate-900/70 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-slate-600 dark:focus:ring-slate-800"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <button
          type="submit"
          className={`mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#111827] ${
            isExpense
              ? "bg-slate-950 hover:bg-slate-800 focus:ring-slate-400 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              : "bg-[#16A34A] hover:bg-[#15803D] focus:ring-emerald-400"
          }`}
        >
          {isExpense ? "Save expense" : "Save side income"}
        </button>
      </form>
    </aside>
  );
}

export default ExpenseForm;
