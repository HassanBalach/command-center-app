"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { STAGES, supabase } from "@/lib/supabase";
import { useSettings } from "@/lib/settings";
import { Avatar } from "./ProfileChip";

export default function HomeStats() {
  const settings = useSettings();
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    supabase
      .from("leads")
      .select("stage")
      .then(({ data }) => {
        const c: Record<string, number> = {};
        (data ?? []).forEach((r) => (c[r.stage] = (c[r.stage] ?? 0) + 1));
        setCounts(c);
      });
  }, []);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Avatar url={settings.avatar_url} name={settings.display_name} size={56} />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold">
            {settings.display_name ? `Hi, ${settings.display_name}` : "Command Center"}
          </h1>
          <p className="truncate text-muted">{settings.bio ?? "Your leads at a glance."}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/pipeline" className="col-span-2 rounded-2xl border border-line bg-surface p-5">
          <p className="text-sm text-muted">Total leads</p>
          <p className="text-4xl font-bold">{total}</p>
        </Link>
        {STAGES.filter((s) => s !== "new").map((s) => (
          <Link key={s} href="/pipeline" className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-sm capitalize text-muted">{s}</p>
            <p className="text-2xl font-bold">{counts[s] ?? 0}</p>
          </Link>
        ))}
      </div>

      <Link href="/leads" className="block rounded-2xl bg-accent p-5 font-semibold text-accent-ink">
        Find new leads →
      </Link>
    </div>
  );
}
