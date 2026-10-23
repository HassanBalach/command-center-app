"use client";

import { useLeadsAccess } from "@/lib/access";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Audit } from "@/lib/audit";
import { localDate, rs, summarize, type Txn } from "@/lib/money";
import { whatsappLink } from "@/lib/pitch";
import { useSettings } from "@/lib/settings";
import { supabase } from "@/lib/supabase";
import ExtLink from "./ExtLink";
import { ArrowIcon, ClockIcon, ReplyIcon, WhatsAppIcon } from "./icons";
import { Avatar } from "./ProfileChip";
import Welcome, { FirstExpense } from "./Welcome";

type L = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  audit: Audit | null;
  stage: string;
  kind?: string;
  follow_up: string | null;
};

const BAR = [
  { stage: "new", label: "New", color: "var(--accent)" },
  { stage: "contacted", label: "Contacted", color: "var(--blue)" },
  { stage: "replied", label: "Replied", color: "var(--warn)" },
  { stage: "won", label: "Won", color: "var(--pink)" },
];

export default function HomeStats() {
  const settings = useSettings();
  const leadsAllowed = useLeadsAccess() === true;
  const [leads, setLeads] = useState<L[]>([]);
  const [txns, setTxns] = useState<Txn[] | null>(null);
  const [today, setToday] = useState("");

  useEffect(() => {
    supabase
      .from("leads")
      .select(
        "id, name, address, phone, website, audit, stage, follow_up, kind",
      )
      .then(({ data }) => {
        setToday(localDate());
        setLeads(((data as L[]) ?? []).filter((l) => l.kind !== "study"));
      });
    supabase
      .from("transactions")
      .select("id, kind, amount, category, note, occurred_on")
      .limit(5000)
      .then(({ data, error }) => {
        if (!error)
          setTxns(
            (data ?? []).map((t) => ({
              ...t,
              amount: Number(t.amount),
            })) as Txn[],
          );
      });
  }, []);

  const count = (stage: string) =>
    leads.filter((l) => l.stage === stage).length;
  const due = leads.filter(
    (l) =>
      today &&
      l.follow_up &&
      l.follow_up <= today &&
      l.stage !== "won" &&
      l.stage !== "lost",
  );
  const pocket = txns ? summarize(txns, today || "0000-00-00") : null;
  const card = "rounded-[20px] border border-line bg-surface p-4";

  return (
    <div className="space-y-3">
      <div className="mb-5 flex items-center gap-3">
        <Avatar
          url={settings.avatar_url}
          name={settings.display_name}
          size={48}
        />
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-muted">Assalamu alaikum</p>
          <h1 className="truncate text-[22px] font-extrabold tracking-tight">
            {settings.display_name ?? "Welcome"}
          </h1>
        </div>
      </div>

      {leadsAllowed && (
        <>
          <div className="rounded-3xl border border-line bg-surface p-5">
            <p className="text-sm font-semibold text-muted">Total leads</p>
            <p className="mt-1 text-5xl font-extrabold tracking-tight">
              {leads.length}
            </p>
            <div className="mt-3.5 flex h-2.5 gap-1 overflow-hidden rounded-full bg-surface-2">
              {BAR.filter((b) => count(b.stage) > 0).map((b) => (
                <div
                  key={b.stage}
                  style={{ flex: count(b.stage), background: b.color }}
                  className="rounded-full"
                />
              ))}
            </div>
            <div className="mt-3.5 flex flex-wrap gap-x-4 gap-y-2 text-[13px] font-medium text-muted">
              {BAR.map((b) => (
                <span key={b.stage} className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: b.color }}
                  />
                  {b.label} {count(b.stage)}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link href="/pipeline" className={card}>
              <span className="flex items-center gap-2 text-[13px] font-bold text-warn">
                <ClockIcon /> Due today
              </span>
              <p className="mt-1.5 text-3xl font-extrabold tracking-tight">
                {due.length}
              </p>
            </Link>
            <Link href="/pipeline" className={card}>
              <span className="flex items-center gap-2 text-[13px] font-bold text-accent">
                <ReplyIcon /> Replies
              </span>
              <p className="mt-1.5 text-3xl font-extrabold tracking-tight">
                {count("replied")}
              </p>
            </Link>
          </div>
        </>
      )}

      <Welcome />
      {txns && txns.length === 0 && <FirstExpense />}

      {pocket && (
        <Link
          href="/money"
          className={`${card} flex items-center justify-between`}
        >
          <span>
            <span className="block text-[13px] font-semibold text-muted">
              In your pocket
            </span>
            <span
              className={`block text-2xl font-extrabold tracking-tight ${pocket.balance < 0 ? "text-danger" : ""}`}
            >
              {pocket.balance < 0 ? "-" : ""}
              {rs(Math.abs(pocket.balance))}
            </span>
          </span>
          <span className="text-right text-[13px] text-muted">
            Spent today
            <span className="block text-base font-bold text-ink">
              {rs(pocket.spentToday)}
            </span>
          </span>
        </Link>
      )}

      {leadsAllowed && (
        <>
          <Link
            href="/leads"
            className="flex h-14 items-center justify-between rounded-[18px] bg-accent px-5 text-base font-extrabold text-accent-ink"
          >
            Find new leads
            <ArrowIcon />
          </Link>

          <div className="flex items-center justify-between pt-3">
            <h2 className="text-lg font-extrabold">Follow up today</h2>
            <Link href="/pipeline" className="text-sm font-bold text-accent">
              See all
            </Link>
          </div>

          <ul className="space-y-2.5">
            {due.slice(0, 3).map((l) => {
              const wa = whatsappLink(
                l.phone,
                l.name,
                !!l.website,
                l.audit,
                settings,
              );
              return (
                <li
                  key={l.id}
                  className="flex h-[68px] items-center gap-3 rounded-[18px] border border-line bg-surface px-3"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-surface-2 font-extrabold">
                    {l.name[0]?.toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold">
                      {l.name}
                    </span>
                    <span className="block truncate text-[13px] text-muted">
                      {l.phone ?? l.address}
                    </span>
                  </span>
                  {wa && (
                    <ExtLink
                      href={wa}
                      aria-label={`Send WhatsApp pitch to ${l.name}`}
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/15 text-accent"
                    >
                      <WhatsAppIcon />
                    </ExtLink>
                  )}
                </li>
              );
            })}
            {due.length === 0 && (
              <p className="py-3 text-sm text-muted">
                No follow-ups due today.
              </p>
            )}
          </ul>
        </>
      )}
    </div>
  );
}
