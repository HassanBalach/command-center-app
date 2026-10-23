"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SETTINGS_CHANGED } from "@/lib/settings";
import { supabase } from "@/lib/supabase";
import { WalletIcon } from "./icons";

// First-run card: asks a new user for their name, then points them at the money tracker.
export default function Welcome() {
  const [needsName, setNeedsName] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("settings")
      .select("display_name")
      .maybeSingle()
      .then(({ data }) => setNeedsName(!data?.display_name));
  }, []);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    const display_name = name.trim();
    if (!display_name) return setError("Tell us what to call you.");
    setBusy(true);
    setError("");
    const { error } = await supabase
      .from("settings")
      .upsert({ display_name, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    setBusy(false);
    if (error) return setError("Couldn't save that. Please try again.");
    setNeedsName(false);
    window.dispatchEvent(new Event(SETTINGS_CHANGED));
  }

  if (!needsName) return null;
  return (
    <form onSubmit={start} className="space-y-4 rounded-3xl border border-line bg-surface p-6">
      <div>
        <p className="text-sm font-semibold text-accent">Welcome 👋</p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight">Let&apos;s get you set up</h2>
        <p className="mt-1.5 text-[15px] leading-snug text-muted">
          Track what you spend, see where your money goes, and plan the month ahead. It takes a few seconds.
        </p>
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="What should we call you?"
        autoFocus
        className="w-full rounded-2xl border border-line bg-surface-2 px-4 py-3 outline-none focus:border-accent"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        disabled={busy}
        className="h-12 w-full rounded-2xl bg-accent text-[15px] font-extrabold text-accent-ink disabled:opacity-50"
      >
        {busy ? "One moment…" : "Get started"}
      </button>
    </form>
  );
}

export function FirstExpense() {
  return (
    <Link
      href="/money"
      className="flex items-center gap-4 rounded-3xl border border-dashed border-line bg-surface p-5"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent">
        <WalletIcon />
      </span>
      <span>
        <span className="block text-base font-extrabold">Add your first cash</span>
        <span className="block text-[13px] text-muted">Start tracking what you have and what you spend.</span>
      </span>
    </Link>
  );
}
