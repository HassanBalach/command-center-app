import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export const STAGES = ["new", "contacted", "replied", "won", "lost"] as const;
export type Stage = (typeof STAGES)[number];

export const KINDS = ["lead", "study"] as const;
export type Kind = (typeof KINDS)[number];

export type SavedLead = {
  id: string;
  place_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviews: number | null;
  score: number;
  audit: import("./audit").Audit | null;
  stage: Stage;
  kind: Kind;
  notes: string | null;
  follow_up: string | null;
};
