"use client";

import { useEffect, useState } from "react";
import { localDate } from "@/lib/money";
import { mapsLink } from "@/lib/links";
import { whatsappLink } from "@/lib/pitch";
import { useSettings } from "@/lib/settings";
import { STAGES, supabase, type SavedLead, type Stage } from "@/lib/supabase";
import ExtLink from "./ExtLink";
import { WhatsAppIcon } from "./icons";

type Tab = Stage | "due";

export default function Pipeline() {
  const settings = useSettings();
  const [leads, setLeads] = useState<SavedLead[]>([]);
  const [today, setToday] = useState("");
  const [tab, setTab] = useState<Tab>("new");

  useEffect(() => {
    supabase
      .from("leads")
      .select("*")
      .order("score", { ascending: false })
      .then(({ data }) => {
        setToday(localDate());
        setLeads((data as SavedLead[]) ?? []);
      });
  }, []);

  async function patch(id: string, changes: Partial<SavedLead>) {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, ...changes } : l)));
    await supabase.from("leads").update(changes).eq("id", id);
  }

  const isDue = (l: SavedLead) =>
    !!today && !!l.follow_up && l.follow_up <= today && l.stage !== "won" && l.stage !== "lost";
  const dueCount = leads.filter(isDue).length;
  const shown = tab === "due" ? leads.filter(isDue) : leads.filter((l) => l.stage === tab);

  const chip = (active: boolean, due = false) =>
    `shrink-0 rounded-full px-4 py-2 text-sm capitalize ${
      active
        ? due
          ? "bg-warn font-extrabold text-accent-ink"
          : "bg-accent font-extrabold text-accent-ink"
        : due
          ? "bg-warn/15 font-bold text-warn"
          : "border border-line font-semibold text-muted"
    }`;

  return (
    <div className="space-y-4">
      <h1 className="text-[28px] font-extrabold tracking-tight">Pipeline</h1>
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5">
        <button onClick={() => setTab("due")} className={chip(tab === "due", true)}>
          Due {dueCount}
        </button>
        {STAGES.map((s) => (
          <button key={s} onClick={() => setTab(s)} className={chip(tab === s)}>
            {s} {leads.filter((l) => l.stage === s).length}
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {shown.map((l) => {
          const wa = whatsappLink(l.phone, l.name, !!l.website, l.audit, settings);
          return (
            <li key={l.id} className="rounded-[22px] border border-line bg-surface p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-surface-2 font-extrabold">
                  {l.name[0]?.toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-extrabold">{l.name}</p>
                  <p className="truncate text-[13px] text-muted">{l.phone ?? l.address}</p>
                </div>
                <span className={`text-[22px] font-extrabold ${l.score >= 80 ? "text-accent" : l.score >= 50 ? "text-warn" : "text-muted"}`}>
                  {l.score}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-3.5 text-[13px] font-bold text-accent">
                {l.website && <ExtLink href={l.website}>Website ↗</ExtLink>}
                <ExtLink href={mapsLink(l.place_id)}>Maps ↗</ExtLink>
                {l.follow_up && (
                  <span
                    className={`ml-auto rounded-full px-2.5 py-1 ${
                      isDue(l) ? "bg-warn/15 text-warn" : "bg-surface-2 font-semibold text-muted"
                    }`}
                  >
                    {isDue(l) ? "Follow up today" : `Follow up ${l.follow_up}`}
                  </span>
                )}
              </div>

              {l.notes && (
                <p className="mt-3 rounded-xl bg-surface-2 px-3 py-2.5 text-[13px] leading-snug text-muted">{l.notes}</p>
              )}

              <details className="mt-3 text-sm">
                <summary className="cursor-pointer font-semibold text-muted">Notes &amp; follow-up</summary>
                <div className="mt-2 space-y-2">
                  <textarea
                    defaultValue={l.notes ?? ""}
                    onBlur={(e) => e.target.value !== (l.notes ?? "") && patch(l.id, { notes: e.target.value })}
                    placeholder="What did they say?"
                    rows={3}
                    className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 outline-none focus:border-accent"
                  />
                  <label className="flex items-center gap-2 text-muted">
                    Follow up on
                    <input
                      type="date"
                      value={l.follow_up ?? ""}
                      onChange={(e) => patch(l.id, { follow_up: e.target.value || null })}
                      className="rounded-lg border border-line bg-surface-2 px-2 py-1 text-ink"
                    />
                  </label>
                </div>
              </details>

              {wa && (
                <ExtLink
                  href={wa}
                  onClick={() => l.stage === "new" && patch(l.id, { stage: "contacted" })}
                  className="mt-3 flex h-[46px] items-center justify-center gap-2 rounded-2xl bg-accent/15 text-sm font-extrabold text-accent"
                >
                  <WhatsAppIcon /> Pitch on WhatsApp
                </ExtLink>
              )}
            </li>
          );
        })}
        {shown.length === 0 && <p className="py-10 text-center text-muted">Nothing here yet.</p>}
      </ul>
    </div>
  );
}
