const iconPaths = {
  income: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9ZM7.5 9.5h5M7.5 13h3M15.5 14.5h1" />
  ),
  limit: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v3M17 3v3M4.5 9.5h15M6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10A2.5 2.5 0 0 1 6.5 5ZM8 13h3.5M8 16h6" />
  ),
  available: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M7 9.5A3.5 3.5 0 0 1 10.5 6H15a2.5 2.5 0 0 1 0 5h-6a2.5 2.5 0 0 0 0 5h4.5A3.5 3.5 0 0 0 17 12.5" />
  ),
  spent: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 6.5h14M8 6.5V5a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 1 16 5v1.5M9 10v6M15 10v6M6.5 6.5l.8 12A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.5l.8-12" />
  ),
  carry: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h7.5A4.5 4.5 0 0 1 19 11.5v0A4.5 4.5 0 0 1 14.5 16H6M9 4 6 7l3 3M15 20l3-3-3-3" />
  ),
  balance: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 18.5V5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5ZM8 15.5h8M8 12h8M8 8.5h3.5" />
  ),
};

const toneClasses = {
  neutral: {
    value: "text-slate-950 dark:text-[#F9FAFB]",
    icon: "text-slate-500 dark:text-[#94A3B8]",
    iconBg: "bg-slate-100 dark:bg-slate-900/70",
  },
  success: {
    value: "text-[#16A34A] dark:text-[#22C55E]",
    icon: "text-[#16A34A] dark:text-[#22C55E]",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  warning: {
    value: "text-[#D97706] dark:text-[#F59E0B]",
    icon: "text-[#D97706] dark:text-[#F59E0B]",
    iconBg: "bg-amber-50 dark:bg-amber-950/30",
  },
  danger: {
    value: "text-[#DC2626] dark:text-[#EF4444]",
    icon: "text-[#DC2626] dark:text-[#EF4444]",
    iconBg: "bg-red-50 dark:bg-red-950/30",
  },
};

const badgeClasses = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400",
  warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400",
  danger: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400",
  neutral: "border-slate-200 bg-slate-50 text-slate-600 dark:border-[#1F2937] dark:bg-slate-900/70 dark:text-[#94A3B8]",
};

const formatCurrency = (value) => {
  const amount = Number(value) || 0;
  const sign = amount < 0 ? "-" : "";

  return `${sign}\u20B9${Math.abs(amount).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};

function SummaryCard({
  title,
  value,
  subtitle,
  detail,
  icon = "income",
  tone = "neutral",
  status,
}) {
  const colors = toneClasses[tone] || toneClasses.neutral;
  const statusTone = status?.tone || "neutral";

  return (
    <article className="group flex min-h-[148px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-[#1F2937] dark:bg-[#111827] dark:hover:border-slate-700">
      <div className="flex items-start justify-between gap-3">
        <div className={`grid h-9 w-9 place-items-center rounded-xl ${colors.iconBg} ${colors.icon}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]" aria-hidden="true">
            {iconPaths[icon] || iconPaths.income}
          </svg>
        </div>

        {status?.label && (
          <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold leading-none ${badgeClasses[statusTone] || badgeClasses.neutral}`}>
            {status.label}
          </span>
        )}
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-[#94A3B8]">
          {title}
        </p>
        <p className={`number-transition mt-2 break-words text-2xl font-semibold tracking-tight sm:text-3xl ${colors.value}`}>
          {typeof value === "number" ? formatCurrency(value) : value}
        </p>
      </div>

      {(subtitle || detail) && (
        <div className="mt-4 space-y-1">
          {subtitle && (
            <p className="text-sm leading-5 text-slate-500 dark:text-[#94A3B8]">
              {subtitle}
            </p>
          )}
          {detail && (
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
              {detail}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

export default SummaryCard;
