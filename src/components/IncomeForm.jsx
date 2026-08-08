import { useState } from "react";
import BrandLogo from "./BrandLogo";
import {
  formatCycleRange,
  formatDateKey,
  getLocalDateKey,
  getNextSalaryDateKey,
  getSalaryCycleDetails,
  parseLocalDateKey,
  sanitizeSalaryDay,
} from "../utils/dateUtils";

function IncomeForm({
  onSubmit,
  activeCycle,
  initialValue = "",
  initialSalaryDay = 1,
  initialReceivedOn = "",
  mode = "setup",
  submitLabel,
}) {
  const initialDay = sanitizeSalaryDay(initialSalaryDay);
  const [inputIncome, setInputIncome] = useState(initialValue);
  const [salaryDay, setSalaryDay] = useState(String(initialDay));
  const [receivedOn, setReceivedOn] = useState(() => {
    if (initialReceivedOn) return initialReceivedOn;
    if (mode === "add") return getLocalDateKey(new Date());
    return getSalaryCycleDetails(new Date(), initialDay).startKey;
  });
  const [error, setError] = useState("");
  const isAddMode = mode === "add";
  const isSettingsMode = mode === "settings";
  const showsAmount = !isSettingsMode;
  const showsSalaryDay = !isAddMode;
  const showsReceiptDate = !isSettingsMode;
  const selectedSalaryDay = sanitizeSalaryDay(salaryDay, initialDay);
  const todayKey = getLocalDateKey(new Date());
  const selectedCycle = isAddMode
    ? activeCycle
    : getSalaryCycleDetails(new Date(), selectedSalaryDay);
  const nextCycleStart = isSettingsMode
    ? getNextSalaryDateKey(new Date(), selectedSalaryDay)
    : null;
  const previewCycle = isSettingsMode
    ? getSalaryCycleDetails(
        parseLocalDateKey(nextCycleStart),
        selectedSalaryDay
      )
    : selectedCycle;
  const receiptCycle = isAddMode ? activeCycle : selectedCycle;
  const description = isAddMode
    ? "Record salary on the date it reached you. The amount is spread only across the remaining days in this salary cycle."
    : isSettingsMode
      ? "Choose your usual salary day. Your current records stay together and the change begins with the next salary cycle."
      : "Set the day your salary cycle begins and when this salary was received. The daily budget follows that cycle instead of the calendar month.";
  const heading = isAddMode
    ? "Record salary"
    : isSettingsMode
      ? "Budget settings"
      : "Set your salary cycle";
  const eyebrow = isAddMode
    ? "Salary receipt"
    : isSettingsMode
      ? "Salary-cycle preferences"
      : "Salary-cycle setup";
  const buttonLabel =
    submitLabel ||
    (isAddMode
      ? "Record salary"
      : isSettingsMode
        ? "Save settings"
        : "Start budgeting");

  const clearError = () => {
    if (error) setError("");
  };

  const handleSave = (event) => {
    event.preventDefault();
    const parsedIncome = Number(inputIncome);
    const parsedSalaryDay = Number(salaryDay);

    if (
      showsSalaryDay &&
      (!Number.isInteger(parsedSalaryDay) ||
        parsedSalaryDay < 1 ||
        parsedSalaryDay > 31)
    ) {
      setError("Salary day must be a whole number from 1 to 31.");
      return;
    }

    if (showsAmount && (!inputIncome || Number.isNaN(parsedIncome))) {
      setError("Enter a valid salary amount.");
      return;
    }

    if (showsAmount && parsedIncome <= 0) {
      setError("Salary must be greater than zero.");
      return;
    }

    if (showsReceiptDate) {
      if (!receivedOn || !parseLocalDateKey(receivedOn)) {
        setError("Choose a valid received date.");
        return;
      }

      if (
        receivedOn < receiptCycle.startKey ||
        receivedOn > receiptCycle.endKey
      ) {
        setError("The received date must be inside the active salary cycle.");
        return;
      }

      if (receivedOn > todayKey) {
        setError("Salary cannot be recorded for a future date.");
        return;
      }
    }

    setError("");
    onSubmit({
      amount: showsAmount ? parsedIncome : null,
      salaryDay: showsSalaryDay ? parsedSalaryDay : null,
      receivedOn: showsReceiptDate ? receivedOn : null,
    });
  };

  return (
    <section className="mx-auto mt-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1F2937] dark:bg-[#111827] sm:p-7">
      <div className="mb-7">
        <BrandLogo className="h-20 w-24" />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-[#94A3B8]">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
          {heading}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-[#94A3B8]">
          {description}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {showsAmount && (
          <div>
            <label
              htmlFor="income-input"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Salary amount
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 dark:text-slate-500">
                {"\u20B9"}
              </span>
              <input
                id="income-input"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="any"
                placeholder="30000"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-base font-semibold text-slate-950 transition duration-200 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-[#1F2937] dark:bg-slate-900/70 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-slate-600 dark:focus:ring-slate-800"
                value={inputIncome}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "salary-form-error" : undefined}
                onChange={(event) => {
                  setInputIncome(event.target.value);
                  clearError();
                }}
              />
            </div>
          </div>
        )}

        {showsSalaryDay && (
          <div>
            <label
              htmlFor="salary-day-input"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Salary day / cycle starts on
            </label>
            <input
              id="salary-day-input"
              type="number"
              inputMode="numeric"
              min="1"
              max="31"
              step="1"
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-semibold text-slate-950 transition duration-200 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-[#1F2937] dark:bg-slate-900/70 dark:text-white dark:focus:border-slate-600 dark:focus:ring-slate-800"
              value={salaryDay}
              aria-invalid={Boolean(error)}
              aria-describedby="salary-day-help"
              onChange={(event) => {
                const nextValue = event.target.value;
                setSalaryDay(nextValue);
                clearError();

                if (mode === "setup") {
                  const nextDay = sanitizeSalaryDay(nextValue, initialDay);
                  setReceivedOn(
                    getSalaryCycleDetails(new Date(), nextDay).startKey
                  );
                }
              }}
            />
            <p
              id="salary-day-help"
              className="mt-2 text-xs leading-5 text-slate-500 dark:text-[#94A3B8]"
            >
              For days 29\u201331, shorter months use their final calendar day.
            </p>
          </div>
        )}

        {showsReceiptDate && (
          <div>
            <label
              htmlFor="salary-received-on"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Salary received on
            </label>
            <input
              id="salary-received-on"
              type="date"
              min={receiptCycle.startKey}
              max={todayKey}
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-semibold text-slate-950 transition duration-200 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-[#1F2937] dark:bg-slate-900/70 dark:text-white dark:focus:border-slate-600 dark:focus:ring-slate-800"
              value={receivedOn}
              aria-invalid={Boolean(error)}
              aria-describedby="salary-received-help"
              onChange={(event) => {
                setReceivedOn(event.target.value);
                clearError();
              }}
            />
            <p
              id="salary-received-help"
              className="mt-2 text-xs leading-5 text-slate-500 dark:text-[#94A3B8]"
            >
              Available in your budget from this date.
            </p>
          </div>
        )}

        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
          aria-live="polite"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
            {isSettingsMode ? "Next salary cycle" : "Active salary cycle"}
          </p>
          <p className="mt-1 text-sm font-semibold">
            {formatCycleRange(previewCycle)}
          </p>
          {isSettingsMode && (
            <p className="mt-1 text-xs leading-5 opacity-80">
              Applies from {formatDateKey(nextCycleStart)}. Current-cycle records
              will not be moved.
            </p>
          )}
        </div>

        {error && (
          <p
            id="salary-form-error"
            role="alert"
            className="text-sm font-medium text-[#EF4444]"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition duration-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 dark:focus:ring-slate-500 dark:focus:ring-offset-[#111827]"
        >
          {buttonLabel}
        </button>
      </form>
    </section>
  );
}

export default IncomeForm;
