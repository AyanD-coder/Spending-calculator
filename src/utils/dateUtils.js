const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const SHORT_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const getDaysInMonth = (year, month) =>
  new Date(year, month + 1, 0).getDate();

export const sanitizeSalaryDay = (value, fallback = 1) => {
  const day = Number(value);

  if (!Number.isInteger(day) || day < 1 || day > 31) {
    return fallback;
  }

  return day;
};

const isValidDate = (date) =>
  date instanceof Date && Number.isFinite(date.getTime());

export const parseLocalDateKey = (dateKey) => {
  const match = DATE_KEY_PATTERN.exec(String(dateKey || ""));

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

const parseDateLike = (value) => {
  if (isValidDate(value)) return new Date(value.getTime());

  const localDate = parseLocalDateKey(value);
  if (localDate) return localDate;

  const date = new Date(value);
  return isValidDate(date) ? date : null;
};

export const getLocalDateKey = (value = new Date()) => {
  const date = parseDateLike(value);
  if (!date) return null;

  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getCalendarOrdinal = (value) => {
  const date = parseDateLike(value);
  if (!date) return null;

  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_IN_MS;
};

const createScheduledDate = (year, month, salaryDay) => {
  const scheduledDay = Math.min(
    sanitizeSalaryDay(salaryDay),
    getDaysInMonth(year, month)
  );

  return new Date(year, month, scheduledDay);
};

export const addDaysToDateKey = (dateKey, amount) => {
  const date = parseLocalDateKey(dateKey);
  if (!date || !Number.isFinite(Number(amount))) return null;

  date.setDate(date.getDate() + Number(amount));
  return getLocalDateKey(date);
};

export const getNextSalaryDateKey = (
  referenceDate = new Date(),
  salaryDay = 1,
  includeToday = false
) => {
  const reference = parseDateLike(referenceDate);
  if (!reference) return null;

  const safeSalaryDay = sanitizeSalaryDay(salaryDay);
  const candidate = createScheduledDate(
    reference.getFullYear(),
    reference.getMonth(),
    safeSalaryDay
  );
  const referenceOrdinal = getCalendarOrdinal(reference);
  const candidateOrdinal = getCalendarOrdinal(candidate);

  if (
    candidateOrdinal > referenceOrdinal ||
    (includeToday && candidateOrdinal === referenceOrdinal)
  ) {
    return getLocalDateKey(candidate);
  }

  return getLocalDateKey(
    createScheduledDate(
      reference.getFullYear(),
      reference.getMonth() + 1,
      safeSalaryDay
    )
  );
};

export const formatDateKey = (dateKey, includeYear = true) => {
  const date = parseLocalDateKey(dateKey);
  if (!date) return "Invalid date";

  const label = `${date.getDate()} ${SHORT_MONTH_NAMES[date.getMonth()]}`;
  return includeYear ? `${label} ${date.getFullYear()}` : label;
};

export const formatCycleRange = (cycle) => {
  const start = parseLocalDateKey(cycle?.startKey || cycle?.cycleStart);
  const end = parseLocalDateKey(cycle?.endKey || cycle?.cycleEnd);

  if (!start || !end) return "Salary cycle";

  if (start.getFullYear() === end.getFullYear()) {
    return `${formatDateKey(getLocalDateKey(start), false)}\u2013${formatDateKey(
      getLocalDateKey(end),
      false
    )} ${end.getFullYear()}`;
  }

  return `${formatDateKey(getLocalDateKey(start))}\u2013${formatDateKey(
    getLocalDateKey(end)
  )}`;
};

const buildCycleDetails = ({
  referenceDate,
  startDate,
  endDate,
  salaryDay,
}) => {
  const reference = parseDateLike(referenceDate);
  const start = parseDateLike(startDate);
  const end = parseDateLike(endDate);

  if (!reference || !start || !end) return null;

  const referenceOrdinal = getCalendarOrdinal(reference);
  const startOrdinal = getCalendarOrdinal(start);
  const endOrdinal = getCalendarOrdinal(end);
  const daysInCycle = Math.max(1, endOrdinal - startOrdinal + 1);
  const unclampedCurrentDay = referenceOrdinal - startOrdinal + 1;
  const currentDay = Math.min(Math.max(1, unclampedCurrentDay), daysInCycle);
  const startKey = getLocalDateKey(start);
  const endKey = getLocalDateKey(end);

  const cycle = {
    id: startKey,
    cycleId: startKey,
    salaryDay: sanitizeSalaryDay(salaryDay),
    startDate: start,
    endDate: end,
    startKey,
    endKey,
    currentDay,
    daysInCycle,
    totalDays: daysInCycle,
    remainingDays: Math.max(1, daysInCycle - currentDay + 1),
  };

  return {
    ...cycle,
    label: formatCycleRange(cycle),
  };
};

export const getSalaryCycleDetails = (
  referenceDate = new Date(),
  salaryDay = 1
) => {
  const reference = parseDateLike(referenceDate) || new Date();
  const safeSalaryDay = sanitizeSalaryDay(salaryDay);
  const currentMonthStart = createScheduledDate(
    reference.getFullYear(),
    reference.getMonth(),
    safeSalaryDay
  );
  const usePreviousMonth =
    getCalendarOrdinal(reference) < getCalendarOrdinal(currentMonthStart);
  const nominalStartMonth = reference.getMonth() - (usePreviousMonth ? 1 : 0);
  const startDate = createScheduledDate(
    reference.getFullYear(),
    nominalStartMonth,
    safeSalaryDay
  );
  const nextStartDate = createScheduledDate(
    startDate.getFullYear(),
    startDate.getMonth() + 1,
    safeSalaryDay
  );
  const endDate = new Date(nextStartDate.getTime());
  endDate.setDate(endDate.getDate() - 1);

  return {
    ...buildCycleDetails({
      referenceDate: reference,
      startDate,
      endDate,
      salaryDay: safeSalaryDay,
    }),
    endExclusiveDate: nextStartDate,
    endExclusiveKey: getLocalDateKey(nextStartDate),
  };
};

export const getCycleDetailsFromMetadata = (
  metadata,
  referenceDate = new Date()
) => {
  if (!metadata?.cycleStart || !metadata?.cycleEnd) return null;

  return buildCycleDetails({
    referenceDate,
    startDate: metadata.cycleStart,
    endDate: metadata.cycleEnd,
    salaryDay: metadata.salaryDay,
  });
};

export const getCycleDayIndex = (dateLike, cycle) => {
  const dateOrdinal = getCalendarOrdinal(dateLike);
  const startOrdinal = getCalendarOrdinal(cycle?.startKey || cycle?.cycleStart);
  const endOrdinal = getCalendarOrdinal(cycle?.endKey || cycle?.cycleEnd);

  if (
    dateOrdinal === null ||
    startOrdinal === null ||
    endOrdinal === null ||
    dateOrdinal < startOrdinal ||
    dateOrdinal > endOrdinal
  ) {
    return null;
  }

  return dateOrdinal - startOrdinal;
};

export const isDateAfterCycle = (dateLike, metadata) => {
  const dateOrdinal = getCalendarOrdinal(dateLike);
  const endOrdinal = getCalendarOrdinal(metadata?.cycleEnd);

  return dateOrdinal !== null && endOrdinal !== null && dateOrdinal > endOrdinal;
};

export const getCurrentDateDetails = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  return {
    year,
    month,
    day,
    daysInMonth: getDaysInMonth(year, month),
  };
};

export const formatExpenseDate = (dateLike) => {
  const dateOnly = parseLocalDateKey(dateLike);
  const date = dateOnly || parseDateLike(dateLike);
  if (!date) return "Invalid date";

  const dateLabel = `${date.getDate()} ${SHORT_MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
  if (dateOnly) return dateLabel;

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${dateLabel} ${hours}:${minutes} ${ampm}`;
};

export const isToday = (dateLike) =>
  getLocalDateKey(dateLike) === getLocalDateKey(new Date());
