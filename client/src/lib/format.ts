const numberFormatter = new Intl.NumberFormat("en-US");

// Dates are stored, filtered and displayed as UTC calendar days, so the day a user
// picks in a date filter is always the day shown in the table.
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const shortDateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export const formatNumber = (value: number) => numberFormatter.format(value);
export const formatDate = (value: string | Date) => dateFormatter.format(new Date(value));
export const formatShortDate = (value: string | Date) => shortDateFormatter.format(new Date(value));

/** `YYYY-MM-DD` value for `<input type="date">`. */
export const toDateInputValue = (value: string | Date) => new Date(value).toISOString().slice(0, 10);

/** A picked calendar day as an ISO timestamp at noon UTC. */
export const fromDateInputValue = (value: string) => `${value}T12:00:00.000Z`;

export function getInitials(name: string) {
  const words = name.replace(/^dr\.?\s+/i, "").trim().split(/\s+/);
  return ((words[0]?.[0] ?? "") + (words.length > 1 ? (words.at(-1)?.[0] ?? "") : "")).toUpperCase();
}
