import { formatExpenseDate } from "../utils/dateUtils";
import { getExpenseCategory } from "../utils/budgetCalculator";

function ExpenseHistory({ expenses, onDeleteExpense }) {
  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-md">
      <h3 className="text-base sm:text-lg font-black text-gray-800 dark:text-white tracking-tight mb-4 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 min-w-0">
          <span className="p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4.5 h-4.5 sm:w-5 sm:h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </span>
          <span className="truncate">Transaction History</span>
        </span>
        <span className="text-[9px] sm:text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold px-2 sm:px-2.5 py-1 rounded-full whitespace-nowrap">
          {expenses.length}
        </span>
      </h3>

      {sortedExpenses.length === 0 ? (
        <div className="text-center py-8 sm:py-10">
          <div className="text-gray-300 dark:text-gray-600 mb-2 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 sm:w-12 sm:h-12">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5 2.25 6m1.5-1.5 1.5 1.5M3.75 4.5v13.5m0-13.5h15c1.06 0 1.913.885 1.82 1.942l-1.047 12a1.875 1.875 0 0 1-1.82 1.808H3.75" />
            </svg>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 font-medium">No transactions logged yet for this month.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[320px] sm:max-h-[380px] overflow-y-auto pr-1">
          {sortedExpenses.map((expense) => {
            const isIncome = expense.type === "income";
            const category = getExpenseCategory(expense);

            return (
              <div key={expense.id} className="py-2.5 sm:py-3.5 flex items-center justify-between gap-2 group transition-all">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 truncate">
                    {expense.description || (isIncome ? "Side Income" : "Expense")}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 font-semibold tracking-wide uppercase">
                      {formatExpenseDate(expense.createdAt)}
                    </span>
                    {!isIncome && (
                      <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-lg">
                        {category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <span className={`text-xs sm:text-sm font-black ${
                    isIncome
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}>
                    {isIncome ? "+" : "-"}{"\u20B9"}
                    {Number(expense.amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </span>
                  {onDeleteExpense && (
                    <button
                      onClick={() => onDeleteExpense(expense.id)}
                      className="text-gray-300 dark:text-gray-600 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      title="Delete transaction"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.24 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ExpenseHistory;
