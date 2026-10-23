"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Lead } from "@/lib/places";
import type { Audit } from "@/lib/audit";
import { supabase, type Kind } from "@/lib/supabase";
import { authedFetch } from "@/lib/api";
import { finalScore } from "@/lib/score";
import { whatsappLink } from "@/lib/pitch";
import LeadCard from "./LeadCard";
import { useSettings } from "@/lib/settings";

const CACHE_DAYS = 30;
const isFresh = (createdAt: string) => Date.now() - new Date(createdAt).getTime() < CACHE_DAYS * 86400000;

export default function LeadSearch() {
  const settings = useSettings();
  const [q, setQ] = useState("");
  const [nearMe, setNearMe] = useState(false);
  const [radiusKm, setRadiusKm] = useState(5);
  const hasLocation = settings.lat !== null && settings.lng !== null;
  const [onlyNoSite, setOnlyNoSite] = useState(false);
  const [minReviews, setMinReviews] = useState(0);
  const [sort, setSort] = useState<"score" | "rating" | "reviews">("score");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [audits, setAudits] = useState<Record<string, Audit | "loading">>({});

  const [saved, setSaved] = useState<Record<string, Kind>>({});

  async function save(l: Lead, kind: Kind) {
    const a = audits[l.id];
    const { error } = await supabase.from("leads").upsert(
      {
        place_id: l.id,
        name: l.name,
        address: l.address,
        phone: l.phone ?? null,
        website: l.website ?? null,
        rating: l.rating ?? null,
        reviews: l.reviews ?? null,
        score: finalScore(l.score, typeof a === "object" ? a : null),
        audit: typeof a === "object" ? a : null,
        kind,
      },
      { onConflict: "user_id,place_id" },
    );
    if (error) setError(error.message.includes("user_id") ? "Sign in first (Pipeline page)" : error.message);
    else setSaved((s) => ({ ...s, [l.id]: kind }));
  }

  async function runAudit(l: Lead) {
    if (!l.website) return;
    setAudits((a) => ({ ...a, [l.id]: "loading" }));
    const res = await authedFetch(`/api/leads/audit?url=${encodeURIComponent(l.website)}`);
    const data = await res.json();
    setAudits((a) => ({ ...a, [l.id]: data }));
  }

  const [history, setHistory] = useState<string[]>([]);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    supabase
      .from("searches")
      .select("query")
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => setHistory((data ?? []).map((r) => r.query as string)));
  }, []);

  const NEAR = / · near me (\d+)km$/;

  async function run(text: string, refresh = false, opts?: { near: boolean; km: number }) {
    const near = (opts?.near ?? nearMe) && hasLocation;
    const km = opts?.km ?? radiusKm;
    const base = text.trim().toLowerCase();
    if (!base) return;
    const query = near ? `${base} · near me ${km}km` : base;
    setQ(text.trim());
    setLoading(true);
    setError("");
    setFromCache(false);

    if (!refresh) {
      const { data } = await supabase
        .from("searches")
        .select("results, created_at")
        .eq("query", query)
        .maybeSingle();
      if (data && isFresh(data.created_at)) {
        setLeads(data.results as Lead[]);
        setFromCache(true);
        setLoading(false);
        return;
      }
    }

    const params = new URLSearchParams({ q: base });
    if (near) {
      params.set("lat", String(settings.lat));
      params.set("lng", String(settings.lng));
      params.set("radius", String(km));
    }
    const res = await authedFetch(`/api/leads/search?${params}`);
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? "Search failed");
    } else {
      setLeads(body.leads);
      const { error: saveError } = await supabase
        .from("searches")
        .upsert(
          { query, results: body.leads, created_at: new Date().toISOString() },
          { onConflict: "user_id,query" },
        );
      if (!saveError) setHistory((h) => [query, ...h.filter((x) => x !== query)].slice(0, 10));
    }
    setLoading(false);
  }

  function runFromHistory(item: string) {
    const m = item.match(NEAR);
    const base = item.replace(NEAR, "");
    const km = m ? Number(m[1]) : radiusKm;
    setNearMe(!!m);
    if (m) setRadiusKm(km);
    run(base, false, { near: !!m, km });
  }

  function search(e: React.FormEvent) {
    e.preventDefault();
    run(q);
  }

  const visible = leads
    .filter((l) => (!onlyNoSite || !l.website) && (l.reviews ?? 0) >= minReviews)
    .sort((a, b) =>
      sort === "rating" ? (b.rating ?? 0) - (a.rating ?? 0) : sort === "reviews" ? (b.reviews ?? 0) - (a.reviews ?? 0) : b.score - a.score,
    );

  return (
    <div className="space-y-4">
      <form onSubmit={search} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="dentists in Dubai, gyms in Lahore, plumbers in London"
          className="min-w-0 flex-1 rounded-2xl border border-line bg-surface px-4 py-3.5 font-semibold outline-none focus:border-accent"
        />
        <button className="rounded-2xl bg-accent px-6 font-extrabold text-accent-ink">
          {loading ? "…" : "Find"}
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {hasLocation ? (
          <>
            <button
              onClick={() => setNearMe((v) => !v)}
              className={`rounded-full px-3.5 py-2 font-bold ${nearMe ? "bg-accent font-semibold text-accent-ink" : "border border-line bg-surface text-muted"}`}
            >
              📍 Near me
            </button>
            {nearMe && (
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="rounded-full border border-line bg-surface px-3.5 py-2 font-semibold text-muted"
              >
                {[2, 5, 10, 25].map((k) => (
                  <option key={k} value={k}>
                    within {k} km
                  </option>
                ))}
              </select>
            )}
            {nearMe && <span className="truncate text-muted">{settings.location_label}</span>}
          </>
        ) : (
          <Link href="/settings" className="text-muted underline">
            Set your location in Settings to search “Near me”
          </Link>
        )}
      </div>

      {history.length > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {history.map((h) => (
            <button
              key={h}
              onClick={() => runFromHistory(h)}
              className="shrink-0 rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-muted"
            >
              {h}
            </button>
          ))}
        </div>
      )}

      {leads.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button
            onClick={() => setOnlyNoSite((v) => !v)}
            className={`rounded-full px-3.5 py-2 font-bold ${onlyNoSite ? "bg-accent font-semibold text-accent-ink" : "border border-line bg-surface text-muted"}`}
          >
            No website
          </button>
          <select
            value={minReviews}
            onChange={(e) => setMinReviews(Number(e.target.value))}
            className="rounded-full border border-line bg-surface px-3.5 py-2 font-semibold text-muted"
          >
            <option value={0}>Any reviews</option>
            <option value={20}>20+ reviews</option>
            <option value={100}>100+ reviews</option>
            <option value={500}>500+ reviews</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-full border border-line bg-surface px-3.5 py-2 font-semibold text-muted"
          >
            <option value="score">Sort: score</option>
            <option value="rating">Sort: rating</option>
            <option value="reviews">Sort: reviews</option>
          </select>
          <span className="text-muted">{visible.length} shown</span>
        </div>
      )}

      {fromCache && (
        <p className="text-sm text-muted">
          Loaded from history, no API call.{" "}
          <button onClick={() => run(q, true)} className="text-accent underline">
            Refresh
          </button>
        </p>
      )}
      {error && <p className="text-danger">{error}</p>}
      {!loading && leads.length === 0 && !error && (
        <p className="py-10 text-center text-muted">Search a niche and city to find leads.</p>
      )}

      <ul className="space-y-3">
        {visible.map((l) => {
          const a = audits[l.id];
          const audit = typeof a === "object" ? a : null;
          return (
            <LeadCard
              key={l.id}
              name={l.name}
              address={l.address}
              rating={l.rating}
              reviews={l.reviews}
              hasWebsite={!!l.website}
              website={l.website}
              placeId={l.id}
              score={finalScore(l.score, audit)}
              audit={a}
              saved={saved[l.id]}
              whatsapp={whatsappLink(l.phone, l.name, !!l.website, audit, settings)}
              onSave={(kind) => save(l, kind)}
              onAudit={() => runAudit(l)}
            />
          );
        })}
      </ul>
    </div>
  );
}
