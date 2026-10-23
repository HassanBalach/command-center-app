export const instant = false;

import LeadsGate from "@/components/LeadsGate";

export default function CreatorPage() {
  return (
    <LeadsGate>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Creator Hub</h1>
        <div className="rounded-2xl border border-dashed border-line p-8 text-center text-muted">
          YouTube, Facebook, Instagram and TikTok stats and posting will live
          here.
        </div>
      </div>
    </LeadsGate>
  );
}
