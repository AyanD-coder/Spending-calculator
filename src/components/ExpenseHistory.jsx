import { getExpenseCategory } from "../utils/budgetCalculator";
import { formatExpenseDate } from "../utils/dateUtils";

const formatCurrency = (value) => {
  const amount = Number(value) || 0;

  return `\u20B9${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};

function ExpenseHistory({ expenses, onDeleteExpense }) {
  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1F2937] dark:bg-[#111827] sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-[#94A3B8]">
            Activity
          </p>
          <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
            Transaction history
          </h3>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-[#1F2937] dark:bg-slate-900/70 dark:text-[#94A3B8]">
          {expenses.length}
        </span>
      </div>

      {sortedExpenses.length === 0 ? (
        <div className="grid min-h-[260px] place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center dark:border-[#1F2937] dark:bg-slate-900/40">
          <div>
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-white text-slate-400 shadow-sm dark:bg-[#111827] dark:text-slate-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5h14v14H5zM8 9h8M8 13h5" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
              No transactions yet
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-[#94A3B8]">
              Add your first expense to start tracking this month.
            </p>
          </div>
        </div>
      ) : (
        <div className="max-h-[424px] overflow-y-auto pr-1">
          <div className="divide-y divide-slate-100 dark:divide-[#1F2937]">
            {sortedExpenses.map((expense) => {
              const isIncome = expense.type === "income";
              const category = getExpenseCategory(expense);

              return (
                <article key={expense.id} className="group flex items-center gap-4 py-3.5">
                  <div className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl ${
                    isIncome
                      ? "bg-emerald-50 text-[#16A34A] dark:bg-emerald-950/30 dark:text-[#22C55E]"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-900/70 dark:text-[#94A3B8]"
                  }`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]" aria-hidden="true">
                      {isIncome ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M6 11l6-6 6 6" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M6 13l6 6 6-6" />
                      )}
                    </svg>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {expense.description || (isIncome ? "Side income" : "Expense")}
                      </p>
                      {!isIncome && (
                        <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-900/70 dark:text-[#94A3B8] sm:inline-flex">
                          {category}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-xs font-medium text-slate-500 dark:text-[#94A3B8]">
                      {formatExpenseDate(expense.createdAt)}
                      {!isIncome ? ` / ${category}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-2">
                    <p className={`text-sm font-semibold ${
                      isIncome ? "text-[#16A34A] dark:text-[#22C55E]" : "text-slate-900 dark:text-white"
                    }`}>
                      {isIncome ? "+" : "-"}
                      {formatCurrency(expense.amount)}
                    </p>
                    {onDeleteExpense && (
                      <button
                        type="button"
                        onClick={() => onDeleteExpense(expense.id)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 opacity-100 transition duration-200 hover:bg-red-50 hover:text-[#EF4444] focus:outline-none focus:ring-2 focus:ring-red-200 dark:text-slate-600 dark:hover:bg-red-950/30 dark:hover:text-[#EF4444] dark:focus:ring-red-900/50 sm:opacity-0 sm:group-hover:opacity-100"
                        aria-label={`Delete ${expense.description || "transaction"}`}
                        title="Delete transaction"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 6h14M9 6V4h6v2M8 10v8M16 10v8M7 6l1 14h8l1-14" />
                        </svg>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

export default ExpenseHistory;
