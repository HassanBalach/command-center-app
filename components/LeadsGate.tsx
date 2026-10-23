"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useLeadsAccess } from "@/lib/access";

// Private pages: anyone without access is quietly sent home instead of seeing an error.
export default function LeadsGate({ children }: { children: React.ReactNode }) {
  const allowed = useLeadsAccess();
  const router = useRouter();
  useEffect(() => {
    if (allowed === false) router.replace("/");
  }, [allowed, router]);
  return allowed ? <>{children}</> : null;
}
