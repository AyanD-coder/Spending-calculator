function BrandLogo({ className = "h-10 w-10", showWordmark = false }) {
  return (
    <span className={`inline-flex items-center gap-3 ${showWordmark ? "" : "justify-center"}`}>
      <img
        src="/logo.webp"
        alt=""
        className={`${className} object-contain`}
        decoding="async"
      />
      {showWordmark && (
        <span className="leading-none">
          <span className="block text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
            Spending Calculator
          </span>
          <span className="mt-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-[#94A3B8]">
            Carry-forward budgeting
          </span>
        </span>
      )}
    </span>
  );
}

export default BrandLogo;
