"use client";

import { useState } from "react";
import type { Audit } from "@/lib/audit";
import { mapsLink } from "@/lib/links";
import ExtLink from "./ExtLink";
import { WhatsAppIcon } from "./icons";

type Props = {
  name: string;
  address?: string | null;
  rating?: number | null;
  reviews?: number | null;
  hasWebsite: boolean;
  website?: string | null;
  placeId?: string;
  score: number;
  audit?: Audit | "loading" | null;
  saved?: boolean;
  whatsapp?: string | null;
  onSave?: () => void;
  onAudit?: () => void;
};

function scoreColor(s: number) {
  return s >= 80 ? "text-accent" : s >= 50 ? "text-warn" : "text-muted";
}

export default function LeadCard(p: Props) {
  const [showMap, setShowMap] = useState(false);
  const embedKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  const audit = typeof p.audit === "object" ? p.audit : null;
  return (
    <li className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{p.name}</p>
          {p.address && <p className="truncate text-sm text-muted">{p.address}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-surface-2 px-2 py-1">
              {p.rating ? `${p.rating}★` : "–"} · {p.reviews ?? 0} reviews
            </span>
            <span
              className={`rounded-full px-2 py-1 ${
                p.hasWebsite ? "bg-surface-2 text-muted" : "bg-accent/15 text-accent"
              }`}
            >
              {p.hasWebsite ? "Has website" : "No website"}
            </span>
          </div>
        </div>
        <div className="text-center">
          <p className={`text-2xl font-bold leading-none ${scoreColor(p.score)}`}>{p.score}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted">score</p>
        </div>
      </div>

      {(p.website || p.placeId) && (
        <div className="mt-3 flex gap-4 text-sm">
          {p.website && (
            <ExtLink href={p.website} className="text-accent underline">
              Website ↗
            </ExtLink>
          )}
          {p.placeId &&
            (embedKey ? (
              <button onClick={() => setShowMap((v) => !v)} className="text-accent underline">
                {showMap ? "Hide map" : "Show map"}
              </button>
            ) : (
              <ExtLink href={mapsLink(p.placeId)} className="text-accent underline">
                Maps ↗
              </ExtLink>
            ))}
        </div>
      )}

      {showMap && embedKey && p.placeId && (
        <iframe
          title={`Map of ${p.name}`}
          loading="lazy"
          className="mt-3 h-48 w-full rounded-xl border border-line"
          src={`https://www.google.com/maps/embed/v1/place?key=${embedKey}&q=place_id:${p.placeId}`}
          referrerPolicy="no-referrer-when-downgrade"
        />
      )}

      {audit && (
        <p className="mt-3 rounded-xl bg-warn/10 px-3 py-2 text-sm text-warn">
          {audit.issues.join(" · ") || "No issues found"}
          {audit.pagespeed !== undefined && ` · PageSpeed ${audit.pagespeed}`}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        {p.onSave && (
          <button
            onClick={p.onSave}
            disabled={p.saved}
            className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-accent-ink disabled:bg-surface-2 disabled:text-muted"
          >
            {p.saved ? "Saved ✓" : "Save lead"}
          </button>
        )}
        {p.hasWebsite && p.onAudit && !audit && (
          <button
            onClick={p.onAudit}
            disabled={p.audit === "loading"}
            className="rounded-xl bg-surface-2 px-4 py-2.5 text-sm"
          >
            {p.audit === "loading" ? "Auditing…" : "Audit"}
          </button>
        )}
        {p.whatsapp && (
          <ExtLink
            href={p.whatsapp}
           
           
            aria-label="WhatsApp pitch"
            className="flex items-center gap-2 rounded-xl bg-accent/15 px-4 py-2.5 text-sm font-medium text-accent"
          >
            <WhatsAppIcon /> Pitch
          </ExtLink>
        )}
      </div>
    </li>
  );
}
