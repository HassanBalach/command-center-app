export type Category = { id: string; kind: Kind; name: string };

export type Kind = "in" | "out";

export type Txn = {
  id: string;
  kind: Kind;
  amount: number;
  category: string;
  note: string | null;
  occurred_on: string; // YYYY-MM-DD
  created_at?: string;
};

// Only used to seed a new user's list once. After that the user owns their categories.
export const STARTER_OUT = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snacks & tea",
  "Transport",
  "Shopping",
  "Bills",
  "Other",
];

export const STARTER_IN = ["Bank withdrawal", "Income", "Gift", "Other"];

export const rs = (n: number) => `Rs ${Math.round(n).toLocaleString("en-PK")}`;

// Local date, not UTC, so "today" flips at your midnight.
export function localDate(d = new Date()) {
  return d.toLocaleDateString("en-CA");
}

export function summarize(txns: Txn[], today: string) {
  const month = today.slice(0, 7);
  let balance = 0;
  let spentToday = 0;
  let spentMonth = 0;
  let addedMonth = 0;
  const byCategory: Record<string, number> = {};
  for (const t of txns) {
    balance += t.kind === "in" ? t.amount : -t.amount;
    if (t.kind === "out") {
      if (t.occurred_on === today) spentToday += t.amount;
      if (t.occurred_on.startsWith(month)) {
        spentMonth += t.amount;
        byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
      }
    } else if (t.occurred_on.startsWith(month)) {
      addedMonth += t.amount;
    }
  }
  const categories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  return { balance, spentToday, spentMonth, addedMonth, categories };
}

export function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return localDate(d);
}

export function fmtDate(date: string, long = false) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: long ? "long" : "short",
    day: "numeric",
    month: long ? "long" : "short",
  });
}

// Time is shown only when the entry was logged on the same day it belongs to.
export function fmtTime(t: { occurred_on: string; created_at?: string }) {
  if (!t.created_at) return "";
  const made = new Date(t.created_at);
  if (localDate(made) !== t.occurred_on) return "";
  return made.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function addMonths(date: string, n: number) {
  const d = new Date(`${date.slice(0, 7)}-01T00:00:00`);
  d.setMonth(d.getMonth() + n);
  return localDate(d);
}

export function fmtMonth(date: string) {
  return new Date(`${date.slice(0, 7)}-01T00:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function daysInMonth(date: string) {
  const d = new Date(`${date.slice(0, 7)}-01T00:00:00`);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function relativeDay(date: string, today: string) {
  if (date === today) return "Today";
  if (date === addDays(today, -1)) return "Yesterday";
  return fmtDate(date, true);
}
