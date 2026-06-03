export const getDaysInMonth = (year, month) => {
  // month is 0-indexed (0 = Jan, 11 = Dec)
  return new Date(year, month + 1, 0).getDate();
};

export const getCurrentDateDetails = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const day = now.getDate(); // 1-indexed
  const daysInMonth = getDaysInMonth(year, month);
  
  return {
    year,
    month,
    day,
    daysInMonth
  };
};

export const formatExpenseDate = (isoString) => {
  const date = new Date(isoString);
  const day = date.getDate();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  
  return `${day} ${month} ${year} ${hours}:${minutes} ${ampm}`;
};

export const isNewMonth = (savedMetadata) => {
  if (!savedMetadata) return false;
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  return savedMetadata.month !== currentMonth || savedMetadata.year !== currentYear;
};

export const isToday = (isoString) => {
  if (!isoString) return false;
  const date = new Date(isoString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};
