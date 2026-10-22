"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { IN_CATEGORIES, OUT_CATEGORIES, localDate, rs, summarize, type Kind, type Txn } from "@/lib/money";

type View = "today" | "month";

const field = "w-full rounded-xl border border-line bg-surface-2 px-4 py-3 outline-none focus:border-accent";

export default function Money() {
  const [txns, setTxns] = useState<Txn[]>([]);
  const [today, setToday] = useState("");
  const [view, setView] = useState<View>("today");
  const [sheet, setSheet] = useState<Kind | null>(null);
  const [error, setError] = useState("");

  function load() {
    supabase
      .from("transactions")
      .select("id, kind, amount, category, note, occurred_on")
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5000)
      .then(({ data, error }) => {
        setToday(localDate());
        if (error) setError(error.message);
        else setTxns((data ?? []).map((t) => ({ ...t, amount: Number(t.amount) })) as Txn[]);
      });
  }

  useEffect(load, []);

  async function remove(t: Txn) {
    if (!confirm(`Delete ${t.kind === "in" ? "+" : "-"}${rs(t.amount)} (${t.category})?`)) return;
    setTxns((all) => all.filter((x) => x.id !== t.id));
    await supabase.from("transactions").delete().eq("id", t.id);
  }

  const s = summarize(txns, today || "0000-00-00");
  const shown = view === "today" ? txns.filter((t) => t.occurred_on === today) : txns.filter((t) => t.occurred_on.startsWith(today.slice(0, 7)));
  const maxCat = s.categories[0]?.[1] ?? 1;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Money</h1>

      <div className="rounded-3xl border border-line bg-surface p-5">
        <p className="text-sm text-muted">In your pocket</p>
        <p className={`mt-1 text-4xl font-extrabold tracking-tight ${s.balance < 0 ? "text-danger" : ""}`}>
          {s.balance < 0 ? "-" : ""}
          {rs(Math.abs(s.balance))}
        </p>
        {s.balance < 0 && (
          <p className="mt-1 text-sm text-danger">You spent more than the cash you added. Add cash to fix it.</p>
        )}
        <div className="mt-4 flex gap-6 text-sm">
          <div>
            <p className="text-muted">Spent today</p>
            <p className="text-lg font-bold">{rs(s.spentToday)}</p>
          </div>
          <div>
            <p className="text-muted">Spent this month</p>
            <p className="text-lg font-bold">{rs(s.spentMonth)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setSheet("out")} className="rounded-2xl bg-accent py-4 text-base font-bold text-accent-ink">
          − Spend
        </button>
        <button onClick={() => setSheet("in")} className="rounded-2xl border border-line bg-surface py-4 text-base font-bold text-accent">
          + Add cash
        </button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-2">
        {(["today", "month"] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              view === v ? "bg-accent font-semibold text-accent-ink" : "border border-line bg-surface text-muted"
            }`}
          >
            {v === "today" ? "Today" : "This month"}
          </button>
        ))}
      </div>

      {view === "month" && (
        <div className="space-y-3 rounded-2xl border border-line bg-surface p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Cash added</span>
            <span className="font-semibold text-accent">+{rs(s.addedMonth)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Spent</span>
            <span className="font-semibold">{rs(s.spentMonth)}</span>
          </div>
          <div className="space-y-2 border-t border-line pt-3">
            {s.categories.length === 0 && <p className="text-sm text-muted">No spending yet this month.</p>}
            {s.categories.map(([name, total]) => (
              <div key={name}>
                <div className="flex justify-between text-sm">
                  <span>{name}</span>
                  <span className="text-muted">{rs(total)}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(4, (total / maxCat) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {shown.map((t) => (
          <li key={t.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{t.category}</p>
              <p className="truncate text-sm text-muted">
                {view === "month" ? `${t.occurred_on} · ` : ""}
                {t.note || (t.kind === "in" ? "Cash added" : "Spent")}
              </p>
            </div>
            <p className={`font-bold ${t.kind === "in" ? "text-accent" : ""}`}>
              {t.kind === "in" ? "+" : "−"}
              {rs(t.amount)}
            </p>
            <button onClick={() => remove(t)} aria-label="Delete entry" className="px-2 text-xl text-muted">
              ×
            </button>
          </li>
        ))}
        {shown.length === 0 && (
          <p className="py-8 text-center text-muted">{view === "today" ? "Nothing recorded today." : "Nothing this month."}</p>
        )}
      </ul>

      {sheet && <AddSheet kind={sheet} onClose={() => setSheet(null)} onSaved={() => { setSheet(null); load(); }} />}
    </div>
  );
}

function AddSheet({ kind, onClose, onSaved }: { kind: Kind; onClose: () => void; onSaved: () => void }) {
  const cats = kind === "out" ? OUT_CATEGORIES : IN_CATEGORIES;
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(cats[0]);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    const value = Number(amount);
    if (!(value > 0)) return setError("Enter an amount above 0");
    setBusy(true);
    const { error } = await supabase.from("transactions").insert({
      kind,
      amount: value,
      category,
      note: note.trim() || null,
      occurred_on: date || localDate(),
    });
    setBusy(false);
    if (error) setError(error.message);
    else onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 md:items-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="safe-bottom w-full max-w-md space-y-4 rounded-t-3xl border border-line bg-surface p-5 md:rounded-3xl"
      >
        <h2 className="text-lg font-bold">{kind === "out" ? "Spend" : "Add cash"}</h2>

        <input
          autoFocus
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
          placeholder="Amount (Rs)"
          className={`${field} text-2xl font-bold`}
        />

        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-3 py-1.5 text-sm ${
                category === c ? "bg-accent font-semibold text-accent-ink" : "border border-line bg-surface-2 text-muted"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className={field} />

        <label className="flex items-center gap-2 text-sm text-muted">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-line bg-surface-2 px-2 py-1 text-ink"
          />
          <span className="text-xs">(empty = today)</span>
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-line py-3 text-muted">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="flex-1 rounded-xl bg-accent py-3 font-bold text-accent-ink disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
