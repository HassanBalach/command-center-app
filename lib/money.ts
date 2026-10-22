export type Kind = "in" | "out";

export type Txn = {
  id: string;
  kind: Kind;
  amount: number;
  category: string;
  note: string | null;
  occurred_on: string; // YYYY-MM-DD
};

export const OUT_CATEGORIES = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snacks & tea",
  "Transport",
  "Shopping",
  "Bills",
  "Other",
];

export const IN_CATEGORIES = ["Bank withdrawal", "Income", "Gift", "Other"];

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
