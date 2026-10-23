export const instant = false;

import LeadSearch from "@/components/LeadSearch";
import LeadsGate from "@/components/LeadsGate";

export default function LeadsPage() {
  return (
    <LeadsGate>
      <div className="space-y-4">
        <h1 className="text-[28px] font-extrabold tracking-tight">Lead Finder</h1>
        <LeadSearch />
      </div>
    </LeadsGate>
  );
}
