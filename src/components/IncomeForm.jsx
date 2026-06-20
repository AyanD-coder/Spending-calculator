import { useState } from "react";
import BrandLogo from "./BrandLogo";

function IncomeForm({ setIncome, initialValue = "" }) {
  const [inputIncome, setInputIncome] = useState(initialValue);
  const [error, setError] = useState("");

  const handleSave = (event) => {
    event.preventDefault();
    const parsed = Number(inputIncome);

    if (!inputIncome || Number.isNaN(parsed)) {
      setError("Enter a valid monthly income.");
      return;
    }

    if (parsed <= 0) {
      setError("Income must be greater than zero.");
      return;
    }

    setError("");
    setIncome(parsed);
  };

  return (
    <section className="mx-auto mt-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1F2937] dark:bg-[#111827] sm:p-7">
      <div className="mb-7">
        <BrandLogo className="h-12 w-12" />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-[#94A3B8]">
          Monthly setup
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
          Set your budget
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-[#94A3B8]">
          Add your monthly income. The app will split it into a daily limit and carry unused money forward each day.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label htmlFor="income-input" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Monthly income
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 dark:text-slate-500">
              {"\u20B9"}
            </span>
            <input
              id="income-input"
              type="number"
              inputMode="decimal"
              min="1"
              placeholder="30000"
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-base font-semibold text-slate-950 transition duration-200 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-[#1F2937] dark:bg-slate-900/70 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-slate-600 dark:focus:ring-slate-800"
              value={inputIncome}
              aria-invalid={Boolean(error)}
              onChange={(event) => {
                setInputIncome(event.target.value);
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

        <button
          type="submit"
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition duration-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 dark:focus:ring-slate-500 dark:focus:ring-offset-[#111827]"
        >
          Continue
        </button>
      </form>
    </section>
  );
}

export default IncomeForm;
