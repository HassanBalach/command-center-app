"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

// null while loading. Lead tools (Google API quota) are only for users granted access in the `access` table.
export function useLeadsAccess(): boolean | null {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  useEffect(() => {
    supabase
      .from("access")
      .select("leads")
      .maybeSingle()
      .then(({ data }) => setAllowed(data?.leads === true));
  }, []);
  return allowed;
}
