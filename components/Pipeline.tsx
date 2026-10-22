"use client";

import { useEffect, useState } from "react";
import { mapsLink } from "@/lib/links";
import { whatsappLink } from "@/lib/pitch";
import { useSettings } from "@/lib/settings";
import { STAGES, supabase, type SavedLead, type Stage } from "@/lib/supabase";
import ExtLink from "./ExtLink";
import { WhatsAppIcon } from "./icons";

type Tab = Stage | "due";

const today = () => new Date().toISOString().slice(0, 10);
const isDue = (l: SavedLead) =>
  !!l.follow_up && l.follow_up <= today() && l.stage !== "won" && l.stage !== "lost";

export default function Pipeline() {
  const settings = useSettings();
  const [leads, setLeads] = useState<SavedLead[]>([]);
  const [tab, setTab] = useState<Tab>("new");

  useEffect(() => {
    supabase
      .from("leads")
      .select("*")
      .order("score", { ascending: false })
      .then(({ data }) => setLeads((data as SavedLead[]) ?? []));
  }, []);

  async function patch(id: string, changes: Partial<SavedLead>) {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, ...changes } : l)));
    await supabase.from("leads").update(changes).eq("id", id);
  }

  const dueCount = leads.filter(isDue).length;
  const shown = tab === "due" ? leads.filter(isDue) : leads.filter((l) => l.stage === tab);
  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-4 py-1.5 text-sm capitalize ${
      active ? "bg-accent font-semibold text-accent-ink" : "border border-line bg-surface text-muted"
    }`;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pipeline</h1>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
        <button onClick={() => setTab("due")} className={chip(tab === "due")}>
          Due · {dueCount}
        </button>
        {STAGES.map((s) => (
          <button key={s} onClick={() => setTab(s)} className={chip(tab === s)}>
            {s} · {leads.filter((l) => l.stage === s).length}
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {shown.map((l) => {
          const wa = whatsappLink(l.phone, l.name, !!l.website, l.audit, settings);
          return (
            <li key={l.id} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{l.name}</p>
                  <p className="truncate text-sm text-muted">{l.phone ?? l.address}</p>
                </div>
                <span className="text-xl font-bold text-accent">{l.score}</span>
              </div>

              <div className="mt-3 flex gap-4 text-sm">
                {l.website && (
                  <ExtLink href={l.website} className="text-accent underline">
                    Website ↗
                  </ExtLink>
                )}
                <ExtLink href={mapsLink(l.place_id)} className="text-accent underline">
                  Maps ↗
                </ExtLink>
                {l.follow_up && (
                  <span className={isDue(l) ? "font-medium text-warn" : "text-muted"}>
                    Follow up {l.follow_up}
                  </span>
                )}
              </div>

              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-muted">Notes &amp; follow-up</summary>
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
                  className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-accent/15 py-2.5 text-sm font-medium text-accent"
                >
                  <WhatsAppIcon /> Pitch
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
