import { assertPublicUrl } from "./safe-url";

export type Audit = {
  reachable: boolean;
  https: boolean;
  loadMs?: number;
  mobileReady: boolean;
  hasOrdering: boolean;
  hasWhatsapp: boolean;
  pagespeed?: number;
  issues: string[];
};

// Follows redirects by hand so every hop is checked against the public-URL rule.
async function safeFetch(start: string): Promise<Response> {
  let current = start;
  for (let hop = 0; hop < 5; hop++) {
    await assertPublicUrl(current);
    const res = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CommandCenterAudit/1.0)" },
    });
    const next = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && next) {
      current = new URL(next, current).toString();
      continue;
    }
    return Object.defineProperty(res, "url", { value: current });
  }
  throw new Error("Too many redirects");
}

const ORDER_HINTS = /order online|add to cart|checkout|book now|book online|book an appointment|booking|schedule|get a quote|contact us/i;

export async function auditSite(url: string): Promise<Audit> {
  const audit: Audit = {
    reachable: false,
    https: url.startsWith("https://"),
    mobileReady: false,
    hasOrdering: false,
    hasWhatsapp: false,
    issues: [],
  };

  const started = Date.now();
  try {
    const res = await safeFetch(url);
    audit.loadMs = Date.now() - started;
    audit.reachable = res.ok;
    audit.https = res.url.startsWith("https://");
    const html = await res.text();
    audit.mobileReady = /<meta[^>]+name=["']viewport["']/i.test(html);
    audit.hasOrdering = ORDER_HINTS.test(html);
    audit.hasWhatsapp = /wa\.me|api\.whatsapp\.com/i.test(html);
  } catch {
    audit.issues.push("Website did not load");
  }

  const key = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (key && audit.reachable) {
    try {
      const api = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
      api.searchParams.set("url", url);
      api.searchParams.set("strategy", "mobile");
      api.searchParams.set("key", key);
      const r = await fetch(api, { signal: AbortSignal.timeout(60000) });
      if (r.ok) {
        const d = await r.json();
        const s = d?.lighthouseResult?.categories?.performance?.score;
        if (typeof s === "number") audit.pagespeed = Math.round(s * 100);
      }
    } catch {}
  }

  if (audit.reachable && !audit.https) audit.issues.push("No HTTPS");
  if (audit.reachable && !audit.mobileReady) audit.issues.push("Not mobile friendly");
  if (audit.reachable && !audit.hasOrdering) audit.issues.push("No clear way to order or book");
  if (audit.reachable && !audit.hasWhatsapp) audit.issues.push("No WhatsApp link");
  if (audit.loadMs && audit.loadMs > 3000) audit.issues.push("Slow to load");
  if (audit.pagespeed !== undefined && audit.pagespeed < 50) audit.issues.push("Poor PageSpeed score");
  return audit;
}
