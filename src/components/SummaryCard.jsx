function SummaryCard({ title, value, type = "gray", subtitle }) {
  const colorMap = {
    green: {
      border: "border-l-4 border-l-emerald-500",
      badge: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30",
      value: "text-emerald-600 dark:text-emerald-400",
    },
    red: {
      border: "border-l-4 border-l-rose-500",
      badge: "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30",
      value: "text-rose-600 dark:text-rose-400",
    },
    gray: {
      border: "border-l-4 border-l-gray-400",
      badge: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600",
      value: "text-gray-700 dark:text-gray-300",
    },
  };

  const colors = colorMap[type] || colorMap.gray;

  return (
    <div className={`bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm ${colors.border} transition-all duration-300 hover:shadow-md flex flex-col justify-between min-h-[110px]`}>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{title}</span>
          <span className={`text-[8px] sm:text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${colors.badge}`}>
            {type === "green" ? "Positive" : type === "red" ? "Overspent" : "Info"}
          </span>
        </div>
        <div className={`text-xl sm:text-2xl font-extrabold tracking-tight ${colors.value} break-words`}>
          ₹{typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : value}
        </div>
      </div>
      {subtitle && (
        <p className="text-[10px] sm:text-[11px] mt-2 text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default SummaryCard;
