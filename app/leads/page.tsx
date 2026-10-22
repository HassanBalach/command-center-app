export const instant = false;

import LeadSearch from "@/components/LeadSearch";

export default function LeadsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Lead Finder</h1>
      <LeadSearch />
    </div>
  );
}
