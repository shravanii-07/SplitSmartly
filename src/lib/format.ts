export const CURRENCY = "₹";

export function formatMoney(value: number): string {
  const abs = Math.abs(value);
  return `${value < 0 ? "-" : ""}${CURRENCY}${abs.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export const GROUP_CATEGORIES = ["Trip", "College", "Food", "Project", "Event", "Other"] as const;
export const EXPENSE_CATEGORIES = [
  "Food",
  "Travel",
  "Stay",
  "Shopping",
  "Entertainment",
  "Utilities",
  "Other",
] as const;

export function friendlyError(error: unknown, fallback = "Something went wrong."): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  if (!raw) return fallback;
  if (/unauthorized/i.test(raw)) return "Please sign in again to continue.";
  if (/fetch|network/i.test(raw)) return "Network problem — please try again.";
  const cleaned = raw.replace(/^Error:\s*/i, "").trim();
  if (cleaned.length > 160 || cleaned.startsWith("{") || cleaned.includes("\n")) return fallback;
  return cleaned;
}
