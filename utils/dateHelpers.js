/**
 * Convert any billing cycle amount to monthly equivalent
 * Used for consistent spending comparisons across plans
 */
const getMonthlyEquivalent = (amount, billingCycle) => {
  const amt = parseFloat(amount);
  switch (billingCycle) {
    case "monthly":     return amt;
    case "quarterly":   return amt / 3;
    case "half-yearly": return amt / 6;
    case "yearly":      return amt / 12;
    default:            return amt;
  }
};

/**
 * Calculate the next renewal date based on billing cycle
 */
const calculateNextRenewal = (currentDate, billingCycle) => {
  const date = new Date(currentDate);
  switch (billingCycle) {
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    case "quarterly":
      date.setMonth(date.getMonth() + 3);
      break;
    case "half-yearly":
      date.setMonth(date.getMonth() + 6);
      break;
    case "yearly":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  return date.toISOString().split("T")[0]; // Return YYYY-MM-DD
};

/**
 * Format a date to Indian readable format
 * e.g., "15 Jan 2025"
 */
const formatIndianDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

/**
 * Get number of days between today and a future date
 */
const daysUntil = (targetDateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDateStr);
  return Math.floor((target - today) / (1000 * 60 * 60 * 24));
};

module.exports = { getMonthlyEquivalent, calculateNextRenewal, formatIndianDate, daysUntil };
