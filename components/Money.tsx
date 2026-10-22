"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  STARTER_IN,
  STARTER_OUT,
  addDays,
  addMonths,
  daysInMonth,
  fmtDate,
  fmtMonth,
  fmtTime,
  localDate,
  relativeDay,
  rs,
  summarize,
  type Category,
  type Kind,
  type Txn,
} from "@/lib/money";

type View = "day" | "month";

const field = "w-full rounded-xl border border-line bg-surface-2 px-4 py-3 outline-none focus:border-accent";

export default function Money() {
  const [txns, setTxns] = useState<Txn[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [today, setToday] = useState("");
  const [view, setView] = useState<View>("day");
  const [picked, setPicked] = useState("");
  const [sheet, setSheet] = useState<Kind | null>(null);
  const [error, setError] = useState("");

  function loadTxns() {
    supabase
      .from("transactions")
      .select("id, kind, amount, category, note, occurred_on, created_at")
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5000)
      .then(({ data, error }) => {
        setToday(localDate());
        if (error) setError(error.message);
        else setTxns((data ?? []).map((t) => ({ ...t, amount: Number(t.amount) })) as Txn[]);
      });
  }

  async function loadCats() {
    const read = () =>
      supabase.from("money_categories").select("id, kind, name").order("position").order("created_at");
    const first = await read();
    if (first.error) return setError(first.error.message);
    let data = first.data ?? [];

    // First time only: give the user a starter set, which they can then delete or extend.
    const { data: st } = await supabase.from("settings").select("money_seeded").maybeSingle();
    if (!st?.money_seeded && (data ?? []).length === 0) {
      const rows = [
        ...STARTER_OUT.map((name, i) => ({ kind: "out", name, position: i })),
        ...STARTER_IN.map((name, i) => ({ kind: "in", name, position: i })),
      ];
      await supabase.from("money_categories").upsert(rows, { onConflict: "user_id,kind,name", ignoreDuplicates: true });
      data = (await read()).data ?? [];
    }
    if (!st?.money_seeded) await supabase.from("settings").upsert({ money_seeded: true }, { onConflict: "user_id" });
    setCats((data ?? []) as Category[]);
  }

  // Fetch-on-mount: setState only runs after the network calls resolve.
  useEffect(() => {
    loadTxns();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCats();
  }, []);

  async function addCategory(kind: Kind, name: string) {
    const clean = name.trim().slice(0, 24);
    if (!clean) return null;
    const existing = cats.find((c) => c.kind === kind && c.name.toLowerCase() === clean.toLowerCase());
    if (existing) return existing.name;
    const { data, error } = await supabase
      .from("money_categories")
      .insert({ kind, name: clean, position: cats.filter((c) => c.kind === kind).length })
      .select("id, kind, name")
      .single();
    if (error) {
      setError(error.message);
      return null;
    }
    setCats((all) => [...all, data as Category]);
    return clean;
  }

  async function removeCategory(c: Category) {
    setCats((all) => all.filter((x) => x.id !== c.id));
    await supabase.from("money_categories").delete().eq("id", c.id);
  }

  async function remove(t: Txn) {
    if (!confirm(`Delete ${t.kind === "in" ? "+" : "-"}${rs(t.amount)} (${t.category})?`)) return;
    setTxns((all) => all.filter((x) => x.id !== t.id));
    await supabase.from("transactions").delete().eq("id", t.id);
  }

  const s = summarize(txns, today || "0000-00-00");
  const sel = picked || today;
  const monthKey = sel.slice(0, 7);
  const isToday = sel === today;

  // Day view
  const dayTxns = txns.filter((t) => t.occurred_on === sel);
  const daySpent = dayTxns.filter((t) => t.kind === "out").reduce((n, t) => n + t.amount, 0);
  const dayAdded = dayTxns.filter((t) => t.kind === "in").reduce((n, t) => n + t.amount, 0);
  const pocketThen = txns.filter((t) => t.occurred_on <= sel).reduce((n, t) => n + (t.kind === "in" ? t.amount : -t.amount), 0);

  // Month view
  const monthTxns = txns.filter((t) => t.occurred_on.startsWith(monthKey));
  const monthSpent = monthTxns.filter((t) => t.kind === "out").reduce((n, t) => n + t.amount, 0);
  const monthAdded = monthTxns.filter((t) => t.kind === "in").reduce((n, t) => n + t.amount, 0);
  const catTotals = Object.entries(
    monthTxns.filter((t) => t.kind === "out").reduce<Record<string, number>>((acc, t) => ((acc[t.category] = (acc[t.category] ?? 0) + t.amount), acc), {}),
  ).sort((a, b) => b[1] - a[1]);
  const maxCat = catTotals[0]?.[1] ?? 1;
  const perDay = Object.entries(
    monthTxns.reduce<Record<string, { spent: number; added: number }>>((acc, t) => {
      const d = (acc[t.occurred_on] ??= { spent: 0, added: 0 });
      if (t.kind === "out") d.spent += t.amount;
      else d.added += t.amount;
      return acc;
    }, {}),
  ).sort((a, b) => b[0].localeCompare(a[0]));
  const maxDay = Math.max(1, ...perDay.map(([, d]) => d.spent));
  const daysCounted = monthKey === today.slice(0, 7) ? Number(today.slice(8, 10)) : daysInMonth(sel);
  const thisMonth = monthKey === today.slice(0, 7);
  const avg = monthSpent / Math.max(1, daysCounted);
  const daysLeft = thisMonth ? daysInMonth(sel) - daysCounted : 0;
  const stillToSpend = avg * daysLeft;
  const projected = monthSpent + stillToSpend;
  const needToWithdraw = Math.max(0, stillToSpend - s.balance);
  const monthEndPocket = txns.filter((t) => t.occurred_on <= `${monthKey}-31`).reduce((n, t) => n + (t.kind === "in" ? t.amount : -t.amount), 0);
  const addedBy = Object.entries(
    monthTxns.filter((t) => t.kind === "in").reduce<Record<string, number>>((acc, t) => ((acc[t.category] = (acc[t.category] ?? 0) + t.amount), acc), {}),
  ).sort((a, b) => b[1] - a[1]);

  const navBtn = "flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-lg disabled:opacity-30";

  return (
    <div className="space-y-5">
      <h1 className="text-[28px] font-extrabold tracking-tight">Money</h1>

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
        {(["day", "month"] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              view === v ? "bg-accent font-semibold text-accent-ink" : "border border-line bg-surface text-muted"
            }`}
          >
            {v === "day" ? "Day" : "Month"}
          </button>
        ))}
      </div>

      {view === "day" && (
        <>
          <div className="flex items-center gap-2">
            <button onClick={() => setPicked(addDays(sel, -1))} aria-label="Previous day" className={navBtn}>
              ‹
            </button>
            <label className="relative flex-1 cursor-pointer rounded-2xl border border-line bg-surface px-4 py-2 text-center">
              <span className="block text-base font-extrabold">{relativeDay(sel, today)}</span>
              <span className="block text-xs text-muted">{fmtDate(sel, true)} · tap to pick a date</span>
              <input
                type="date"
                value={sel}
                max={today}
                onChange={(e) => e.target.value && setPicked(e.target.value)}
                aria-label="Pick a date"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>
            <button onClick={() => setPicked(addDays(sel, 1))} disabled={isToday} aria-label="Next day" className={navBtn}>
              ›
            </button>
          </div>
          {!isToday && (
            <button onClick={() => setPicked("")} className="text-sm font-semibold text-accent">
              Back to today
            </button>
          )}

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl border border-line bg-surface px-2 py-3">
              <p className="text-xs text-muted">Spent</p>
              <p className="font-extrabold">{rs(daySpent)}</p>
            </div>
            <div className="rounded-2xl border border-line bg-surface px-2 py-3">
              <p className="text-xs text-muted">Added</p>
              <p className="font-extrabold text-accent">{rs(dayAdded)}</p>
            </div>
            <div className="rounded-2xl border border-line bg-surface px-2 py-3">
              <p className="text-xs text-muted">{isToday ? "Pocket now" : "Pocket after"}</p>
              <p className="font-extrabold">{rs(pocketThen)}</p>
            </div>
          </div>

          <ul className="space-y-2">
            {dayTxns.map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{t.category}</p>
                  <p className="truncate text-sm text-muted">
                    {[t.note || (t.kind === "in" ? "Cash added" : "Spent"), fmtTime(t)].filter(Boolean).join(" · ")}
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
            {dayTxns.length === 0 && (
              <p className="py-8 text-center text-muted">{isToday ? "Nothing recorded today." : "Nothing recorded on this day."}</p>
            )}
          </ul>
        </>
      )}

      {view === "month" && (
        <>
          <div className="flex items-center gap-2">
            <button onClick={() => setPicked(addMonths(sel, -1))} aria-label="Previous month" className={navBtn}>
              ‹
            </button>
            <div className="flex-1 rounded-2xl border border-line bg-surface px-4 py-2.5 text-center text-base font-extrabold">
              {fmtMonth(sel)}
            </div>
            <button onClick={() => setPicked(addMonths(sel, 1))} disabled={thisMonth} aria-label="Next month" className={navBtn}>
              ›
            </button>
          </div>
          {!thisMonth && (
            <button onClick={() => setPicked("")} className="text-sm font-semibold text-accent">
              Back to this month
            </button>
          )}

          {thisMonth ? (
            <div className="space-y-3 rounded-3xl border border-line bg-surface p-5">
              <p className="text-sm font-semibold text-muted">Month forecast</p>
              <div>
                <p className="text-sm text-muted">You&apos;ll spend about</p>
                <p className="text-3xl font-extrabold tracking-tight">{rs(projected)}</p>
                <p className="text-xs text-muted">
                  {rs(monthSpent)} spent so far + about {rs(stillToSpend)} for the last {daysLeft} {daysLeft === 1 ? "day" : "days"}
                </p>
              </div>
              <div className="border-t border-line pt-3">
                <p className="text-sm text-muted">To get through the month you&apos;ll need to take out</p>
                <p className={`text-2xl font-extrabold tracking-tight ${needToWithdraw > 0 ? "text-warn" : "text-accent"}`}>
                  {needToWithdraw > 0 ? `about ${rs(needToWithdraw)} more` : "nothing more"}
                </p>
                <p className="text-xs text-muted">
                  {needToWithdraw > 0
                    ? `You have ${rs(s.balance)} in your pocket now.`
                    : `Your pocket (${rs(s.balance)}) covers the rest of the month at this pace.`}
                </p>
              </div>
              <p className="text-xs text-muted">Based on your daily average so far ({rs(avg)} a day).</p>
            </div>
          ) : (
            <div className="space-y-1 rounded-3xl border border-line bg-surface p-5">
              <p className="text-sm font-semibold text-muted">Month result</p>
              <p className="text-3xl font-extrabold tracking-tight">{rs(monthSpent)} spent</p>
              <p className="text-sm text-muted">
                {rs(monthAdded)} taken out · {rs(monthEndPocket)} left in your pocket at month end
              </p>
            </div>
          )}

          <div className="space-y-3 rounded-2xl border border-line bg-surface p-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-muted">Spent</p>
                <p className="font-extrabold">{rs(monthSpent)}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Cash added</p>
                <p className="font-extrabold text-accent">{rs(monthAdded)}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Daily average</p>
                <p className="font-extrabold">{rs(monthSpent / daysCounted)}</p>
              </div>
            </div>
            {addedBy.length > 0 && (
              <div className="space-y-1 border-t border-line pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Cash added from</p>
                {addedBy.map(([name, total]) => (
                  <div key={name} className="flex justify-between text-sm">
                    <span>{name}</span>
                    <span className="font-semibold text-accent">+{rs(total)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2 border-t border-line pt-3">
              {catTotals.length === 0 && <p className="text-sm text-muted">No spending this month.</p>}
              {catTotals.map(([name, total]) => (
                <div key={name}>
                  <div className="flex justify-between text-sm">
                    <span>{name}</span>
                    <span className="text-muted">
                      {rs(total)} · {Math.round((total / monthSpent) * 100)}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(4, (total / maxCat) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <ul className="space-y-2">
            {perDay.map(([d, v]) => (
              <li key={d}>
                <button
                  onClick={() => {
                    setPicked(d);
                    setView("day");
                  }}
                  className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{relativeDay(d, today)}</span>
                    <span className="font-bold">
                      {v.spent > 0 ? rs(v.spent) : "–"}
                      {v.added > 0 && <span className="ml-2 text-sm text-accent">+{rs(v.added)}</span>}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${(v.spent / maxDay) * 100}%` }} />
                  </div>
                </button>
              </li>
            ))}
            {perDay.length === 0 && <p className="py-6 text-center text-muted">Nothing recorded this month.</p>}
          </ul>
        </>
      )}

      {sheet && (
        <AddSheet
          kind={sheet}
          cats={cats.filter((c) => c.kind === sheet)}
          today={today || localDate()}
          initialDate={sel || today || localDate()}
          onAddCategory={(name) => addCategory(sheet, name)}
          onRemoveCategory={removeCategory}
          onClose={() => setSheet(null)}
          onSaved={() => {
            setSheet(null);
            loadTxns();
          }}
        />
      )}
    </div>
  );
}

function AddSheet({
  kind,
  cats,
  today,
  initialDate,
  onAddCategory,
  onRemoveCategory,
  onClose,
  onSaved,
}: {
  kind: Kind;
  cats: Category[];
  today: string;
  initialDate: string;
  onAddCategory: (name: string) => Promise<string | null>;
  onRemoveCategory: (c: Category) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(initialDate);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Nothing picked yet (or the picked one was deleted): fall back to the first available category.
  const selected = cats.some((c) => c.name === category) ? category : (cats[0]?.name ?? "");

  async function create() {
    const name = await onAddCategory(newName);
    if (name) setCategory(name);
    setNewName("");
    setAdding(false);
  }

  async function save() {
    const value = Number(amount);
    if (!(value > 0)) return setError("Enter an amount above 0");
    if (!selected) return setError("Add a category first (tap + New)");
    setBusy(true);
    const { error } = await supabase.from("transactions").insert({
      kind,
      amount: value,
      category: selected,
      note: note.trim() || null,
      occurred_on: date || today,
    });
    setBusy(false);
    if (error) setError(error.message);
    else onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 md:items-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="safe-bottom max-h-[92dvh] w-full max-w-md space-y-4 overflow-y-auto rounded-t-3xl border border-line bg-surface p-5 md:rounded-3xl"
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

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Category</span>
            {cats.length > 0 && (
              <button onClick={() => setEditing((v) => !v)} className="font-semibold text-accent">
                {editing ? "Done" : "Edit"}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {cats.map((c) =>
              editing ? (
                <button
                  key={c.id}
                  onClick={() => onRemoveCategory(c)}
                  aria-label={`Delete category ${c.name}`}
                  className="flex items-center gap-1.5 rounded-full border border-danger/50 px-3 py-1.5 text-sm text-danger"
                >
                  {c.name} <span aria-hidden="true">×</span>
                </button>
              ) : (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.name)}
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    selected === c.name ? "bg-accent font-semibold text-accent-ink" : "border border-line bg-surface-2 text-muted"
                  }`}
                >
                  {c.name}
                </button>
              ),
            )}
            {!editing && (
              <button
                onClick={() => setAdding((v) => !v)}
                className="rounded-full border border-dashed border-accent px-3 py-1.5 text-sm font-semibold text-accent"
              >
                + New
              </button>
            )}
          </div>
          {editing && <p className="text-xs text-muted">Tap a category to delete it. Past entries keep their category.</p>}
          {cats.length === 0 && !adding && <p className="text-sm text-muted">No categories yet. Tap + New to create one.</p>}
          {adding && (
            <div className="flex gap-2">
              <input
                autoFocus
                value={newName}
                maxLength={24}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && create()}
                placeholder="New category, e.g. Travel"
                className={field}
              />
              <button onClick={create} className="rounded-xl bg-accent px-5 font-bold text-accent-ink">
                Add
              </button>
            </div>
          )}
        </div>

        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className={field} />

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Date · {fmtDate(date, true)}</span>
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value || today)}
              className="rounded-lg border border-line bg-surface-2 px-2 py-1 text-ink"
            />
          </div>
          <div className="flex gap-2">
            {[
              ["Today", today],
              ["Yesterday", addDays(today, -1)],
            ].map(([label, value]) => (
              <button
                key={label}
                onClick={() => setDate(value)}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  date === value ? "bg-accent font-semibold text-accent-ink" : "border border-line bg-surface-2 text-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

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
