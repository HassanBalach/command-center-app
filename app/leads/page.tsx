export const instant = false;

import LeadSearch from "@/components/LeadSearch";

export default function LeadsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-[28px] font-extrabold tracking-tight">Lead Finder</h1>
      <LeadSearch />
    </div>
  );
}
