export default function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = 24;
  const c = 2 * Math.PI * r;
  const color = score >= 80 ? "text-accent" : score >= 50 ? "text-warn" : "text-muted";
  return (
    <div className={`relative shrink-0 ${color}`} style={{ width: size, height: size }} aria-label={`Score ${score}`}>
      <svg width={size} height={size} viewBox="0 0 56 56" style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="5" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${(Math.min(100, Math.max(0, score)) / 100) * c} ${c}`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[17px] font-extrabold text-ink">{score}</span>
    </div>
  );
}
