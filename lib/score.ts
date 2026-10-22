import type { Audit } from "./audit";

// Lead score after the website audit: a dead or weak site makes a better lead.
export function finalScore(base: number, audit?: Audit | null): number {
  if (!audit) return base;
  const bonus = !audit.reachable ? 25 : Math.min(20, audit.issues.length * 5);
  return Math.min(100, base + bonus);
}
