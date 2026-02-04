export const YEAR = 2026;

const pad2 = (value) => String(value).padStart(2, "0");

export function getDefaultDateKey({ year = YEAR, now = new Date() } = {}) {
  if (now.getFullYear() === year) {
    return `${year}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  }
  return `${year}-01-01`;
}

export function isValidDateKey(value, { year = YEAR } = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;

  const [y, m, d] = (value || "").split("-").map((x) => Number.parseInt(x, 10));
  if (y !== year) return false;
  if (!Number.isFinite(m) || m < 1 || m > 12) return false;

  const daysInMonth = new Date(year, m, 0).getDate();
  if (!Number.isFinite(d) || d < 1 || d > daysInMonth) return false;

  return true;
}

export function getValidDateKey(
  value,
  { year = YEAR, fallback = getDefaultDateKey({ year }) } = {}
) {
  return isValidDateKey(value, { year }) ? value : fallback;
}
