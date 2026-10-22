"use client";

import { supabase } from "@/lib/supabase";

export default function LogoutButton({ className = "" }: { className?: string }) {
  return (
    <button
      onClick={() => supabase.auth.signOut()}
      className={`rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-danger ${className}`}
    >
      Log out
    </button>
  );
}
