"use client";

import { useState } from "react";
import type { Audit } from "@/lib/audit";
import { mapsLink } from "@/lib/links";
import ExtLink from "./ExtLink";
import { WhatsAppIcon } from "./icons";
import ScoreRing from "./ScoreRing";

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

export default function LeadCard(p: Props) {
  const [showMap, setShowMap] = useState(false);
  const embedKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  const audit = typeof p.audit === "object" ? p.audit : null;

  return (
    <li className="rounded-[22px] border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-extrabold">{p.name}</p>
          {p.address && <p className="mt-0.5 truncate text-[13px] text-muted">{p.address}</p>}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="rounded-full bg-surface-2 px-2.5 py-1 font-semibold">
              {p.rating ? `${p.rating} ★` : "–"} · {p.reviews ?? 0} reviews
            </span>
            <span
              className={`rounded-full px-2.5 py-1 font-bold ${
                p.hasWebsite ? "bg-surface-2 font-semibold text-muted" : "bg-accent/15 text-accent"
              }`}
            >
              {p.hasWebsite ? "Has website" : "No website"}
            </span>
          </div>
        </div>
        <ScoreRing score={p.score} />
      </div>

      {(p.website || p.placeId) && (
        <div className="mt-3 flex gap-4 text-sm font-bold">
          {p.website && (
            <ExtLink href={p.website} className="text-accent">
              Website ↗
            </ExtLink>
          )}
          {p.placeId &&
            (embedKey ? (
              <button onClick={() => setShowMap((v) => !v)} className="font-bold text-accent">
                {showMap ? "Hide map" : "Show map"}
              </button>
            ) : (
              <ExtLink href={mapsLink(p.placeId)} className="text-accent">
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
        <p className="mt-3 rounded-xl bg-warn/12 px-3 py-2.5 text-[13px] font-semibold text-warn">
          {audit.issues.join(" · ") || "No issues found"}
          {audit.pagespeed !== undefined && ` · PageSpeed ${audit.pagespeed}`}
        </p>
      )}

      <div className="mt-3.5 flex gap-2">
        {p.onSave && (
          <button
            onClick={p.onSave}
            disabled={p.saved}
            className="h-11 flex-1 rounded-2xl bg-accent text-sm font-extrabold text-accent-ink disabled:bg-surface-2 disabled:text-muted"
          >
            {p.saved ? "Saved ✓" : "Save lead"}
          </button>
        )}
        {p.hasWebsite && p.onAudit && !audit && (
          <button
            onClick={p.onAudit}
            disabled={p.audit === "loading"}
            className="h-11 rounded-2xl border border-line px-4 text-sm font-bold"
          >
            {p.audit === "loading" ? "Auditing…" : "Audit"}
          </button>
        )}
        {p.whatsapp && (
          <ExtLink
            href={p.whatsapp}
            aria-label="Send WhatsApp pitch"
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-line text-accent"
          >
            <WhatsAppIcon />
          </ExtLink>
        )}
      </div>
    </li>
  );
}
